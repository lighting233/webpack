
   (() => {
    var modules = {
      
          "./src/name.js": (module,exports,require) => {
            module.exports = "zhufeng";
          },
          "./src/title.js": (module,exports,require) => {
            let name = require("./src/name.js");

module.exports = "hello " + name;
          }
    };
    var cache = {};
    function require(moduleId) {
      if (cache[moduleId]) {
        return cache[moduleId].exports;
      }
      var module = (cache[moduleId] = {
        exports: {},
      });
      modules[moduleId](module, module.exports, require);
      return module.exports;
    }
    (() => {
     let title = require("./src/title.js");

console.log(title);
    })();
  })();
   