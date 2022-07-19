var cordovaReady = new Promise((resolve, reject) => { document.addEventListener('deviceready', resolve, false); });

const testDirName = "electron/testDirectory";

/** @type {DirectoryEntry} */
let testDir;

describe("Simple", function() {
  beforeAll(async function() {
    await cordovaReady;

    // Clean out all files.
    // Tested: requestAllPaths
    let fs = await new Promise((resolve, reject) => { window.requestFileSystem(window.PERSISTENT, 5 * 1024 * 1024, (fs) => { resolve(fs); } )});
    let dir = fs.root;
    // let entries = await new Promise((resolve, reject) => { dir.createReader().readEntries(resolve, reject); });
    // for (var file of entries) {
    //   // if (file.isFile) {
    //   //   let entry = await new Promise((resolve, reject) => dir.getFile(file.name, { create: false, exclusive: false }, resolve, reject));
    //   //   await new Promise((resolve, reject) => { entry.remove(resolve, reject); });
    //   //   console.log("Cleaned up " + file.fullPath);
    //   // }

    //   if (file.isDirectory && file.name === testDir) {
    //     let entry = await new Promise((resolve, reject) => dir.getDirectory(file.name, { create: false, exclusive: false }, resolve, reject));
    //     // https://www.w3.org/TR/2011/WD-file-system-api-20110419/#widl-Entry-remove
    //     await new Promise((resolve, reject) => { entry.remove(resolve, reject); });
    //     console.log("Cleaned up " + file.fullPath);
    //   }
    // }

    try {
      // Remove existing.
      testDir = await new Promise((resolve, reject) => { fs.root.getDirectory(testDirName, { create: false, exclusive: false }, resolve, reject) });
      console.log("Cleaning up old testing directory" + testDir.fullPath);
      await recursiveRemove(testDir);
    } finally {
      testDir = await new Promise((resolve, reject) => { fs.root.getDirectory(testDirName, { create: true, exclusive: false }, resolve, reject) });
    }
    console.log("Testing dir" + testDir.fullPath);

    // await new Promise((resolve, reject) => { setTimeout(resolve, 3000); });
  });

  // https://cordova.apache.org/docs/en/11.x/reference/cordova-plugin-file/index.html
  xit("write and read newTempFile.txt in app data", async function() {
    const filename = "newTempFile.txt";
    let fs = await new Promise((resolve, reject) => { window.requestFileSystem(window.TEMPORARY, 5 * 1024 * 1024, (fs) => { resolve(fs); } )});
    expect(fs.name).toBe(`C:\\dev\\cordova-electron-filesystem\\platforms\\electron\\`);
    let fileEntry = await new Promise((resolve, reject) => { fs.root.getFile(filename, {create: true, exclusive: false}, resolve, reject) });
    let writer = await new Promise((resolve, reject) => { fileEntry.createWriter(resolve); });
    let data = new Blob(['some file data'], { type: 'text/plain' });
    await new Promise((resolve, reject) => { writer.onwriteend = resolve; writer.onerror = reject; writer.write(data); });
    let file = await new Promise((resolve, reject) => { fileEntry.file(resolve, reject); });
    let resultText = await new Promise((resolve, reject) => { let reader = new FileReader(); reader.onloadend = function() { resolve(this.result); }; reader.readAsText(file); });
    expect(resultText).toBe('some file data');
  });

  xit("Append a file using alternative methods", async function() {
    const filename = "newTempFile-append.txt";
    let fs = await new Promise((resolve, reject) => { window.requestFileSystem(window.TEMPORARY, 5 * 1024 * 1024, (fs) => { resolve(fs); } )});
    let fileEntry = await new Promise((resolve, reject) => { fs.root.getFile(filename, {create: true, exclusive: false}, resolve, reject) });
    let writer = await new Promise((resolve, reject) => { fileEntry.createWriter(resolve); });
    let data = new Blob(['some file data'], { type: 'text/plain' });
    await new Promise((resolve, reject) => { writer.onwriteend = resolve; writer.onerror = reject; writer.write(data); });
    data = new Blob(['extraData'], { type: 'text/plain' });
    await new Promise((resolve, reject) => { writer.onwriteend = resolve; writer.onerror = reject; writer.seek(writer.length); writer.write(data); });
    let file = await new Promise((resolve, reject) => { fileEntry.file(resolve, reject); });
    let resultText = await new Promise((resolve, reject) => { let reader = new FileReader(); reader.onloadend = function() { resolve(this.result); }; reader.readAsText(file); });
    expect(resultText).toBe('some file dataextraData');
  });

  it("Directories and moving", async function() {
    const filename = "newTempFile-append.txt";
    await writeFile(`file.txt`, "contents");
    let dir = await new Promise((resolve, reject) => { testDir.getDirectory("moveDir", { create: true, exclusive: false }, resolve, reject) });

    // Tested:moveTo
    let fileEntry = await new Promise((resolve, reject) => { testDir.getFile(`file.txt`, {}, resolve, reject) });
    await new Promise((resolve, reject) => { fileEntry.moveTo(dir, "filerenamed.txt", resolve, reject) });

    // Tested:copyTo
    fileEntry = await new Promise((resolve, reject) => { dir.getFile(`filerenamed.txt`, {}, resolve, reject) });
    await new Promise((resolve, reject) => { fileEntry.copyTo(dir, "filerenamed-copied.txt", resolve, reject) });

    fileEntry = await new Promise((resolve, reject) => { dir.getFile(`filerenamed-copied.txt`, {}, resolve, reject) });
    let file = await new Promise((resolve, reject) => { fileEntry.file(resolve, reject); });
    let resultText = await new Promise((resolve, reject) => { let reader = new FileReader(); reader.onloadend = function() { resolve(this.result); }; reader.readAsText(file); });
    expect(resultText).toBe('contents');

    // Tested:readEntries
    /** @type {Entry[]} */
    let entries = await new Promise((resolve, reject) => { dir.createReader().readEntries(resolve, reject); });
    expect(entries.map(o => o.name).indexOf("filerenamed-copied.txt")).toBeGreaterThan(-1);
    expect(entries.map(o => o.name).indexOf("filerenamed.txt")).toBeGreaterThan(-1);
    expect(entries.map(o => o.name).indexOf("file.txt")).toBe(-1);
  });


// getDirectory: getDirectoryHandler,
// removeRecursively: removeRecursively,
// getFile: getFileHandler,
// getFileMetadata: getFileMetadata,
// setMetadata: setMetadata,
// remove: removeHandler,
// getParent: getParentHandler,
// readAsDataURL: readAsDataURLHandler,
// readAsBinaryString: readAsBinaryStringHandler,
// readAsArrayBuffer: readAsArrayBufferHandler,
// readAsText: readAsTextHandler,
// write: writeHandler,
// requestFileSystem: requestFileSystemHandler,
// resolveLocalFileSystemURI: resolveLocalFileSystemURIHandler,
// // exec's below are not implemented in browser platform
// truncate: notifyNotSupported,
// requestAllFileSystems: notifyNotSupported,
// // method below is used for backward compatibility w/ old File plugin implementation
// _getLocalFilesystemPath: _getLocalFilesystemPathHandler

const writeFile = async function(filename, contents) {
  let fileEntry = await new Promise((resolve, reject) => { testDir.getFile(filename, {create: true, exclusive: false}, resolve, reject) });
  let writer = await new Promise((resolve, reject) => { fileEntry.createWriter(resolve); });
  let data = new Blob([contents], { type: 'text/plain' });
  await new Promise((resolve, reject) => { writer.onwriteend = resolve; writer.onerror = reject; writer.write(data); });
}

/**
 * 
 * @param {DirectoryEntry} folderEntry 
 */
const recursiveRemove = async (folderEntry) => {
/** @type {Entry[]} */
  let entries = await new Promise((resolve, reject) => { folderEntry.createReader().readEntries(resolve, reject); });
  for (var entry of entries) {
    if (entry.isDirectory) {
      await recursiveRemove(entry);
    }
    await new Promise((resolve, reject) => { entry.remove(resolve, reject); });
    // await new Promise((resolve, reject) => { setTimeout(resolve, 1000); })
  }
}
/***********************************************************************
// For extra logging, open cdv-electron-preload.js
contextBridge.exposeInMainWorld('_cdvElectronIpc', {
  exec: (success, error, serviceName, action, args) => {
      console.log("preload: " + JSON.stringify(args));
      const succ = (r) => { 
          console.log("preload done:" + action + ":" + JSON.stringify(r)); 
          success(r); 
      }
      return ipcRenderer.invoke('cdv-plugin-exec', serviceName, action, args)
          .then(
              succ,
              error
          );
  },

  hasService: (serviceName) => cordova &&
  cordova.services &&
  cordova.services[serviceName]
});

// And platforms\electron\www\cdv-electron-main.js
ipcMain.handle('cdv-plugin-exec', async (_, serviceName, action, ...args) => {
  if (cordova && cordova.services && cordova.services[serviceName]) {
      const plugin = require(cordova.services[serviceName]);
      console.log(`ipcMain:${action}: ` + JSON.stringify(args));
**********************************************************************/



//   it("newTempFile.txt 2", function() {
//       function onErrorReadFile(e) { console.error(e); }
//       function displayFileData(data) { console.log(data); }
//       // https://cordova.apache.org/docs/en/11.x/reference/cordova-plugin-file/index.html
//       function createFile(dirEntry, fileName, isAppend) {
//           // Creates a new file or returns the file if it already exists.
//           dirEntry.getFile(fileName, {create: true, exclusive: false}, function(fileEntry) {
      
//               writeFile(fileEntry, null, isAppend);
      
//           }, onErrorReadFile);
//       }

//       function readFile(fileEntry) {
//           fileEntry.file(function (file) {
//               var reader = new FileReader();
      
//               reader.onloadend = function() {
//                   console.log("Successful file read: " + this.result);
//                   debugger;
//                   displayFileData(fileEntry.fullPath + ": " + this.result);
//               };
      
//               reader.readAsText(file);
      
//           }, onErrorReadFile);
//       }

//       function writeFile(fileEntry, dataObj) {
//           // Create a FileWriter object for our FileEntry (log.txt).
//           fileEntry.createWriter(function (fileWriter) {
      
//               fileWriter.onwriteend = function() {
//                   console.log("Successful file write...");
//                   readFile(fileEntry);
//               };
      
//               fileWriter.onerror = function (e) {
//                   console.log("Failed file write: " + e.toString());
//               };
      
//               // If data object is not passed in,
//               // create a new Blob instead.
//               if (!dataObj) {
//                   dataObj = new Blob(['some file data'], { type: 'text/plain' });
//               }
      
//               fileWriter.write(dataObj);
//           });
//       }

//       window.requestFileSystem(window.TEMPORARY, 5 * 1024 * 1024, function (fs) {
//           console.log('file system open: ' + fs.name);
//           createFile(fs.root, "newTempFile.txt", false);
//       }, (e) => { throw e; });

//   });

  // describe("when song has been paused", function() {
  //   beforeEach(function() {
  //   });

  //   it("should indicate that the song is currently paused", function() {
  //   });

  //   it("should be possible to resume", function() {
  //   });
  // });
});



/** Old module **/

// module.exportsa = {
//     requestAllPaths: async ([args]) => {
//         return pathsPrefix;
//     },

//     requestFileSystem: async ([args]) => {
//         var [first, second] = args;
//         log("requestFileSystem " + first + " - " + second);
//         return {
//             name: "aa",
//             root: {
//             }
//         };
//     },

//     // https://www.w3.org/TR/2012/WD-file-system-api-20120417/#widl-DirectoryEntry-getFile-void-DOMString-path-Flags-options-EntryCallback-successCallback-ErrorCallback-errorCallback
//     /**
//      * 
//      * @param {*} param0 
//      * @returns {Entry}
//      */
//     getFile: async ([args]) => {
//         var [path, options, successCallback, errorCallback] = args;
//         return {
//             name: "",
//             fullPath: ""
//         }
//     },

//     getFileMetadata: async ([args]) => {
//         var [path, options, successCallback, errorCallback] = args;
//         log(args);
//         return {
//             name: "",
//             fullPath: ""
//         }
//     },

//     write: async ([args]) => {
//         var [path, options, successCallback, errorCallback] = args;
//         log(args);
//         notImplementedYet(args);
//     },
// };

// log("Electron fileplugin loaded");
