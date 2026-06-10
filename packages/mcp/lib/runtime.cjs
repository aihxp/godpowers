const path = require('path');

function requireRuntimeModule(name) {
  try {
    return require(`godpowers/lib/${name}`);
  } catch (firstError) {
    const localPath = path.resolve(__dirname, '..', '..', '..', 'lib', name);
    try {
      return require(localPath);
    } catch (secondError) {
      const error = new Error(`Unable to load Godpowers runtime module ${name}: ${firstError.message}`);
      error.cause = secondError;
      throw error;
    }
  }
}

module.exports = {
  requireRuntimeModule
};
