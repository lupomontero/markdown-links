const pathSytem = require('path');
const fs = require('fs');
const { promises: filesystem } = require("fs");
const marked = require('marked');
const readdirp = require('readdirp');
const got = require('got');

const convertToAbosulute = (pathToConvert) => {
  if (typeof pathToConvert !== 'string') {
    console.log('Path provided is not a string');
    return '';
  }

  const resolvedPath = pathSytem.resolve(pathToConvert);
  return resolvedPath;
}

const isFolder = (pathToCheck) => fs.lstatSync(pathToCheck).isDirectory();

const validateLinks = (linksObjArr) => {
  console.log('validating links...')
  linksObjArr.forEach((linkObj) => {

    got(linkObj.href).then(response => {
      const statusCode = response.statusCode;
      let status = 'fail';
      if(statusCode === 200){
        status = 'ok'
      }
      linkObj.statusCode = statusCode;
      linkObj.status = status;
      console.log(linkObj);
    }).catch(error => {
      console.log(error.message);
    });

  });
}

const processMarkdownFile = (pathToRead, mycallback, validate = false) => {
  fs.readFile(pathToRead, (err, data) => {
    if (err) {
      console.error(err.message);
      console.error(`Sorry I can't read file: ${pathToRead}`);
    }
    const linksArray = getLinks(data.toString());
    // console.log(linksArray);
    if (validate) {
      validateLinks(linksArray);
    }
    return mycallback(pathToRead, linksArray);
  })
}

const getLinks = (markdownText) => {
  var links = [];
  var renderer = new marked.Renderer();
  renderer.link = function (href, title, text) {
    links.push({ href, text });
  };
  // here is where the marked functions creates an html file
  // from a markdown text and when it is rendering the links
  // it pushes them to my links array and place undefined in that place
  marked(markdownText, { renderer });
  return links;
}

const printResults = (pathName, linksArray) => {
  // pathName = pathSytem.basename(pathName);
  linksArray.forEach(linkObj => {
    const textTruncated = linkObj.text.substring(0, 50);
    console.log(pathName, linkObj.href, textTruncated);
  });
}

const getFiles = (path, getFilesCallback) => {
  const allFilePaths = []
  const settings = {
    fileFilter: '*.md',
    alwaysStat: true,
    directoryFilter: ['!.git', '!node_modules'],
  }
  readdirp(path, settings)
    .on('data', (entry) => {
      const filePath = entry.fullPath;
      allFilePaths.push(filePath);
    })
    // Optionally call stream.destroy() in `warn()` in order to abort and cause 'close' to be emitted
    .on('warn', error => console.error('non-fatal error', error))
    .on('error', error => console.error('fatal error', error))
    .on('end', () => getFilesCallback(allFilePaths));
}

const processAllFiles = (allFiles) => {
  if (allFiles.length === 0) {
    console.log('There is no markdown files inside this folder')
    return 'error code?'
  }
  allFiles.forEach(file => processMarkdownFile(file, printResults));
}

const mdLinks = (path, options = { validate: false }) => {
  console.log('Iniciando funcion mdLinks');

  console.log(`Getting absolute path ...`);
  path = convertToAbosulute(path);

  if (path === '') {
    console.log('Please use a valid path');
    return 'error code?';
  }

  console.info(`is ${path} file or folder?`);

  try {
    if (isFolder(path)) {
      console.log('path is a folder');
      getFiles(path, processAllFiles);
    } else {
      if (path.slice(-2) !== 'md') {
        console.log("Sorry, I can't process a file with a extension different to .md")
        return 'error code?';
      }
      // the next function resolves in the future
      processMarkdownFile(path, printResults, options.validate);
    }
  } catch (e) {
    console.error(e.message);
    console.info('Please provide a valid PATH');
    return 'Error code?';
  }
  return 'Success code?';
}

module.exports = mdLinks;
