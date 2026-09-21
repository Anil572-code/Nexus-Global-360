(function () {
  "use strict";

  var marker = "nexus.employee-id-migration.v8.5.24";

  var mappings = [
    ["NGL-001", "PRJ-001"],
    ["NGL-002", "ANIL-002"],
    ["NGL-003", "AAK-003"],
    ["NGL-004", "SAR-004"],
    ["NGL-005", "SUB-005"]
  ];

  function replaceIds(value) {
    if (typeof value !== "string") return value;

    var next = value;

    for (var i = 0; i < mappings.length; i += 1) {
      next = next.split(mappings[i][0]).join(mappings[i][1]);
    }

    return next;
  }

  function migrateStorage(storage) {
    if (!storage) return;

    try {
      if (storage.getItem(marker) === "complete") {
        return;
      }

      var snapshot = [];

      for (var index = 0; index < storage.length; index += 1) {
        var key = storage.key(index);

        if (key !== null) {
          snapshot.push([key, storage.getItem(key)]);
        }
      }

      for (var itemIndex = 0; itemIndex < snapshot.length; itemIndex += 1) {
        var oldKey = snapshot[itemIndex][0];
        var oldValue = snapshot[itemIndex][1];

        var newKey = replaceIds(oldKey);
        var newValue = replaceIds(oldValue);

        if (newKey !== oldKey) {
          if (storage.getItem(newKey) === null) {
            storage.setItem(newKey, newValue);
          } else if (oldValue !== newValue) {
            storage.setItem(newKey, newValue);
          }

          storage.removeItem(oldKey);
        } else if (oldValue !== newValue) {
          storage.setItem(oldKey, newValue);
        }
      }

      storage.setItem(marker, "complete");
    } catch (_) {
      // Storage may be unavailable in privacy-restricted browser contexts.
      // The application continues using the new canonical seed authority.
    }
  }

  migrateStorage(window.localStorage);
  migrateStorage(window.sessionStorage);
})();