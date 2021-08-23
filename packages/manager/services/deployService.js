const fsp = require("fs").promises;
const fs = require("fs");
const path = require("path");
const mvdir = require("mvdir");
//const common = require("@spaship/common");
const decompress = require("decompress");
const config = require("../config");
const fileService = require("./fileService");

/**
 * detect if the archive was created with `npm pack`.  npm pack creates a
 * tarball with a "package" dir.  we want what's in the package dir but not
 * the dir itself.
 * @param {*} dir
 */
const isNPMPack = async (dir) => {
  try {
    const packageStat = await fsp.lstat(path.join(dir, "package"));
    return packageStat.isDirectory();
  } catch (e) {
    console.warn("Package directory not found");
  }
  return false;
};

async function deploy({ name, spaArchive, appPath, ref } = {}) {
  // create a dir in the tmp_dir location, but keep the random archive name
  let tmpDir = `${spaArchive}-extracted`;
  await fsp.mkdir(tmpDir);

  // extract the archive
  await decompress(spaArchive, tmpDir);

  // if the archive was generated by `npm pack`, move into the "package"
  // directory where all the goodies are.
  const shouldRepath = await isNPMPack(tmpDir);
  if (shouldRepath) {
    tmpDir = path.join(tmpDir, "package");
  }

  let spaConfig = { name, path: appPath };
  let hasYaml = false;
  const yamlFilePath = path.join(tmpDir, "spaship.yaml");
  try {
    spaConfig = await common.config.read(yamlFilePath);
    hasYaml = true;
  } catch (e) {
    console.warn("SPAship yaml config not found");
  }

  const validation = common.config.validate(spaConfig);

  if (!validation.valid) {
    throw new Error(`spaship.yaml is not valid: ${JSON.stringify(validation.errors)}`);
  }

  // remove starting slashes in paths
  const flatPath = common.flatpath.toDir(spaConfig.path);
  const destDir = path.join(config.get("webroot"), flatPath);

  // write spa metadata to filesystem
  if (!hasYaml) {
    await fileService.write(yamlFilePath, { name, path: spaConfig.path });
  }
  if (ref) {
    await fileService.write(yamlFilePath, { ref });
  }

  try {
    const htaccessPath = path.join(tmpDir, ".htaccess");
    if (!fs.existsSync(htaccessPath)) {
      await common.htaccess.write(tmpDir, spaConfig);
    } else {
      console.info("SPA included an .htaccess file, we will not write one");
    }
  } catch (error) {
    console.error("There was an error writing .htaccess file.", error);
  }

  if (fs.existsSync(destDir)) {
    await fsp.rmdir(destDir, { recursive: true });
  }

  await mvdir(tmpDir, destDir);
}

module.exports = { deploy };
