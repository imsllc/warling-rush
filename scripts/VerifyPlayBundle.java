import java.nio.file.*;
import java.security.cert.*;
import java.util.*;
import java.util.jar.*;
import java.nio.charset.StandardCharsets;

class VerifyPlayBundle {
  record Field(int number, long value, byte[] bytes) {}
  static long varint(byte[] data, int[] pos) {
    long value = 0; int shift = 0;
    while (true) { int b = data[pos[0]++] & 255; value |= (long)(b & 127) << shift; if (b < 128) return value; shift += 7; }
  }
  static List<Field> fields(byte[] data) {
    var result = new ArrayList<Field>(); int[] pos = {0};
    while (pos[0] < data.length) {
      long tag = varint(data, pos); int wire = (int)(tag & 7); int number = (int)(tag >>> 3);
      if (wire == 0) result.add(new Field(number, varint(data, pos), null));
      else if (wire == 2) { int length = (int)varint(data, pos); result.add(new Field(number, 0, Arrays.copyOfRange(data, pos[0], pos[0] + length))); pos[0] += length; }
      else if (wire == 1) pos[0] += 8;
      else if (wire == 5) pos[0] += 4;
      else throw new IllegalStateException("Unknown protobuf wire type");
    }
    return result;
  }
  static String string(List<Field> fields, int number) {
    return fields.stream().filter(f -> f.number == number && f.bytes != null).map(f -> new String(f.bytes, StandardCharsets.UTF_8)).findFirst().orElse("");
  }
  static String metadataValue(byte[] element, String key) {
    var content = fields(element);
    if ("meta-data".equals(string(content, 3))) {
      var attrs = new HashMap<String,String>();
      for (var field : content) if (field.number == 4) { var attr = fields(field.bytes); attrs.put(string(attr, 2), string(attr, 3)); }
      if (key.equals(attrs.get("name"))) return attrs.getOrDefault("value", "");
    }
    for (var child : content) if (child.number == 5) {
      for (var node : fields(child.bytes)) if (node.number == 1) {
        var version = metadataValue(node.bytes, key);
        if (!version.isEmpty()) return version;
      }
    }
    return "";
  }
  public static void main(String[] args) throws Exception {
    var expected = CertificateFactory.getInstance("X.509").generateCertificate(Files.newInputStream(Path.of(args[1])));
    try (var jar = new JarFile(args[0], true)) {
      int verified = 0; var names = new HashSet<String>();
      for (var entry : Collections.list(jar.entries())) {
        names.add(entry.getName());
        if (entry.isDirectory()) continue;
        try (var input = jar.getInputStream(entry)) { input.transferTo(java.io.OutputStream.nullOutputStream()); }
        if (entry.getName().startsWith("META-INF/")) continue;
        var certs = entry.getCertificates();
        if (certs == null || !Arrays.asList(certs).contains(expected)) throw new SecurityException("Upload signature missing or mismatched: " + entry.getName());
        verified++;
      }
      var manifest = jar.getInputStream(jar.getJarEntry("base/manifest/AndroidManifest.xml")).readAllBytes();
      var root = fields(manifest).stream().filter(f -> f.number == 1).findFirst().orElseThrow();
      var attributes = new HashMap<String,String>();
      for (var field : fields(root.bytes)) if (field.number == 4) { var attr = fields(field.bytes); attributes.put(string(attr, 2), string(attr, 3)); }
      System.out.println("Manifest: " + attributes);
      if (!args[2].equals(attributes.get("versionCode")) || !args[3].equals(attributes.get("versionName")) || !"com.warlingrush.app".equals(attributes.get("package"))) throw new IllegalStateException("Unexpected manifest identity/version");
      if (args.length > 4) {
        var version = metadataValue(root.bytes, "com.google.android.play.billingclient.version");
        if (!args[4].equals(version)) throw new IllegalStateException("Unexpected or missing billing library version: " + version);
        if (!new String(manifest, StandardCharsets.UTF_8).contains("com.android.vending.BILLING")) throw new IllegalStateException("Missing billing permission");
        System.out.println("Billing permission and library version verified: " + version);
      }
      if (args.length > 6) {
        if (!args[5].equals(metadataValue(root.bytes, "com.google.android.gms.ads.APPLICATION_ID"))) throw new IllegalStateException("Wrong AdMob app ID");
        boolean placement = false;
        for (var name : names) if (name.startsWith("base/dex/") && name.endsWith(".dex")) {
          var dex = new String(jar.getInputStream(jar.getJarEntry(name)).readAllBytes(), StandardCharsets.ISO_8859_1);
          placement |= dex.contains(args[6]);
          if (dex.contains("ca-app-pub-3940256099942544/5224354917")) throw new IllegalStateException("Test ad placement in Play bundle");
        }
        if (!placement) throw new IllegalStateException("Missing live rewarded placement");
        System.out.println("Live AdMob app and rewarded placement verified; no test placement in Play bundle");
      }
      for (String abi : List.of("arm64-v8a", "x86_64")) {
        if (names.stream().noneMatch(n -> n.startsWith("base/lib/" + abi + "/"))) throw new IllegalStateException("Missing ABI " + abi);
        System.out.println("Native libraries present: " + abi);
      }
      if (!names.contains("base/assets/index.android.bundle")) throw new IllegalStateException("Missing offline JavaScript");
      System.out.println("Offline JavaScript present; upload certificate matches; verified signed entries: " + verified);
    }
  }
}
