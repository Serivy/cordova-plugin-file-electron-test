// @ts-check
var cordovaReady = new Promise((resolve, reject) => { document.addEventListener('deviceready', resolve, false); });

describe("Simple", function() {
  beforeAll(async function() {
    await cordovaReady;
    const testDirName = "testDirectory";

    // Clean out all files.
    // Tested: requestAllPaths
    // Tested: requestFileSystem
    await new Promise((resolve, reject) => { window.requestFileSystem(window.PERSISTENT, 5 * 1024 * 1024, (fs) => { resolve(fs); } )});
    let root = await new Promise((resolve, reject) => { window.resolveLocalFileSystemURL(cordova.file.dataDirectory, resolve, reject); });
    // let entries = await new Promise((resolve, reject) => { dir.createReader().readEntries(resolve, reject); });
    // for (var file of entries) {
    //   // if (file.isFile) {
    //   //   let entry = await new Promise((resolve, reject) => dir.getFile(file.name, { create: false, exclusive: false }, resolve, reject));
    //   //   await new Promise((resolve, reject) => { entry.remove(resolve, reject); });
    //   //   console.log("Cleaned up " + file.fullPath);
    //   // }

    //   if (file.isDirectory && file.name === window.testDir) {
    //     let entry = await new Promise((resolve, reject) => dir.getDirectory(file.name, { create: false, exclusive: false }, resolve, reject));
    //     // https://www.w3.org/TR/2011/WD-file-system-api-20110419/#widl-Entry-remove
    //     await new Promise((resolve, reject) => { entry.remove(resolve, reject); });
    //     console.log("Cleaned up " + file.fullPath);
    //   }
    // }

    try {
      // Remove existing.
      let existingtestDir = await new Promise((resolve, reject) => { root.getDirectory(testDirName, { create: false, exclusive: false }, resolve, reject) });
    if (existingtestDir) {
        console.log("Cleaning up old testing directory: " + existingtestDir.fullPath);
        await new Promise((resolve, reject) => { existingtestDir.removeRecursively(resolve, reject); });
      }
    } catch (e) {
    } finally {
      window.testDir = await new Promise((resolve, reject) => { root.getDirectory(testDirName, { create: true, exclusive: false }, resolve, reject) });
    }
    console.log("Testing dir" + window.testDir.fullPath);

    // await new Promise((resolve, reject) => { setTimeout(resolve, 3000); });
  });

  // https://cordova.apache.org/docs/en/11.x/reference/cordova-plugin-file/index.html
  it("write and read newTempFile.txt in app data", async function() {
    const filename = "newTempFile.txt";
    /** @type {DirectoryEntry} */
    let dir = await new Promise((resolve, reject) => { window.testDir.getDirectory("readwrite-test", { create: true, exclusive: false }, resolve, reject) });
    expect(dir.name).toBe(`readwrite-test`);
    let fileEntry = await new Promise((resolve, reject) => { dir.getFile(filename, {create: true, exclusive: false}, resolve, reject) });
    let writer = await new Promise((resolve, reject) => { fileEntry.createWriter(resolve); });
    let data = new Blob(['some file data'], { type: 'text/plain' });
    await new Promise((resolve, reject) => { writer.onwriteend = resolve; writer.onerror = reject; writer.write(data); });
    let file = await new Promise((resolve, reject) => { fileEntry.file(resolve, reject); });
    // Tested:readAsText
    let resultText = await new Promise((resolve, reject) => { let reader = new FileReader(); reader.onloadend = function() { resolve(this.result); }; reader.readAsText(file); });
    expect(resultText).toBe('some file data');
  });

  it("Append a file using alternative methods", async function() {
    const filename = "newTempFile-append.txt";
    let fileEntry = await new Promise((resolve, reject) => { window.testDir.getFile(filename, {create: true, exclusive: false}, resolve, reject) });
    let writer = await new Promise((resolve, reject) => { fileEntry.createWriter(resolve); });
    let data = new Blob(['some file data'], { type: 'text/plain' });
    // Tested:write
    await new Promise((resolve, reject) => { writer.onwriteend = resolve; writer.onerror = reject; writer.write(data); });
    data = new Blob(['extraData'], { type: 'text/plain' });
    // Tested:write
    await new Promise((resolve, reject) => { writer.onwriteend = resolve; writer.onerror = reject; writer.seek(writer.length); writer.write(data); });
    let file = await new Promise((resolve, reject) => { fileEntry.file(resolve, reject); });
    let resultText = await new Promise((resolve, reject) => { let reader = new FileReader(); reader.onloadend = function() { resolve(this.result); }; reader.readAsText(file); });
    expect(resultText).toBe('some file dataextraData');
  });

  it("Directories and moving", async function() {
    const filename = "newTempFile-append.txt";
    await writeFile(`file.txt`, "contents");
    /** @type {DirectoryEntry} */
    // Tested:getDirectory:create
    let dir = await new Promise((resolve, reject) => { window.testDir.getDirectory("moveDir", { create: true, exclusive: false }, resolve, reject) });

    // Tested:getFile
    /** @type {FileEntry} */
    let fileEntry = await new Promise((resolve, reject) => { window.testDir.getFile(`file.txt`, {}, resolve, reject) });
    // Tested:moveTo
    await new Promise((resolve, reject) => { fileEntry.moveTo(dir, "filerenamed.txt", resolve, reject) });

    // Tested:copyTo
    fileEntry = await new Promise((resolve, reject) => { dir.getFile(`filerenamed.txt`, {}, resolve, reject) });
    await new Promise((resolve, reject) => { fileEntry.copyTo(dir, "filerenamed-copied.txt", resolve, reject) });

    fileEntry = await new Promise((resolve, reject) => { dir.getFile(`filerenamed-copied.txt`, {}, resolve, reject) });
    let file = await new Promise((resolve, reject) => { fileEntry.file(resolve, reject); });
    expect(fileEntry.name).toBe("filerenamed-copied.txt")
    expect(file.name).toBe(fileEntry.name);

    let resultText = await new Promise((resolve, reject) => { let reader = new FileReader(); reader.onloadend = function() { resolve(this.result); }; reader.readAsText(file); });
    expect(resultText).toBe('contents');

    // Tested:readEntries
    /** @type {Entry[]} */
    let entries = await new Promise((resolve, reject) => { dir.createReader().readEntries(resolve, reject); });
    expect(entries.map(o => o.name).indexOf("filerenamed-copied.txt")).toBeGreaterThan(-1);
    expect(entries.map(o => o.name).indexOf("filerenamed.txt")).toBeGreaterThan(-1);
    expect(entries.map(o => o.name).indexOf("file.txt")).toBe(-1);

    // Copy a file
    fileEntry = await new Promise((resolve, reject) => { dir.getFile(`filerenamed-copied.txt`, {}, resolve, reject) });
    await new Promise((resolve, reject) => { fileEntry.copyTo(dir, "filerenamed-copied-todelete.txt", resolve, reject) });

    // Tested:remove
    fileEntry = await new Promise((resolve, reject) => { dir.getFile(`filerenamed-copied-todelete.txt`, {}, resolve, reject) });

    await new Promise((/** @type {(value: void) => void} */resolve , reject) => { fileEntry.remove(resolve, reject) });

    // Tested:removeRecursivly
    await new Promise((/** @type {(value: void) => void} */resolve, reject) => { dir.removeRecursively(resolve, reject); });
  });

  
  it("Handle Errors", async function() {
    const filename = "newTempFile-append.txt";
    /** @type {DirectoryEntry} */
    let dir = await new Promise((resolve, reject) => { window.testDir.getDirectory("a-dir", { create: true, exclusive: false }, resolve, reject) });
    await writeFile(`a-dir/file.txt`, "contents");
    await writeFile(`a-dir/file2.txt`, "contents");

    // Test delete on folder not empty, should error.

    let exception;
    try {
      await DirectoryEntryRemove(dir);
      
      await new Promise((/** @type {(value: void) => void} */resolve, reject) => { dir.remove(resolve, reject) });
    } catch (e) {
      exception = e;
    }

    expect(exception.code.message).toContain("ENOTEMPTY");
  });

  it("readAs", async function() {
    const filename = "text.txt";
    /** @type {DirectoryEntry} */
    let dir = await new Promise((resolve, reject) => { window.testDir.getDirectory("readAs-test", { create: true, exclusive: false }, resolve, reject) });
    await writeFile(`readAs-test/text.txt`, "text");
    let fileEntry = await new Promise((resolve, reject) => { dir.getFile(filename, {create: false, exclusive: false}, resolve, reject) });
    let file = await new Promise((resolve, reject) => { fileEntry.file(resolve, reject); });
      
    // Tested:readAsArrayBuffer
    let resultBuf = await new Promise((resolve, reject) => { let reader = new FileReader(); reader.onloadend = function() { resolve(this.result); }; reader.readAsArrayBuffer(file); });
    let uintarray = new Uint8Array(resultBuf);
    expect(uintarray).toEqual(new Uint8Array([116, 101, 120, 116]));

    // Tested:readAsDataURL
    // let resultData = await new Promise((resolve, reject) => { let reader = new FileReader(); reader.onloadend = function() { resolve(this.result); }; reader.readAsDataURL(file); });
    let resultData = await readAsPromise(dir, filename, {create: false, exclusive: false}, "readAsDataURL");
    expect(resultData).toEqual("data:text/plain;base64,dGV4dA==");
  });

  it("imageTests", async function() {
    const filename = "img.png";
    /** @type {DirectoryEntry} */
    let dir = await new Promise((resolve, reject) => { window.testDir.getDirectory("imageTests-test", { create: true, exclusive: false }, resolve, reject) });

    const img = await fetch("img/logo.png");
    const imgData = await img.blob();
    const imgDataUri = await new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = (o) => resolve(reader.result); reader.onerror = (o) => reject(reader.error); reader.onabort = (o) => reject(new Error()); reader.readAsDataURL(imgData); });
    const imgBufferArray = await imgData.arrayBuffer();
    const imgBinaryString = await new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = (o) => resolve(reader.result); reader.onerror = (o) => reject(reader.error); reader.onabort = (o) => reject(new Error()); reader.readAsBinaryString(imgData); });
    
    let fileEntry = await new Promise((resolve, reject) => { dir.getFile(filename, {create: true, exclusive: false}, resolve, reject) });
    let writer = await new Promise((resolve) => { fileEntry.createWriter(resolve); });
    await new Promise((resolve, reject) => { writer.onwriteend = resolve; writer.onerror = reject; writer.write(imgData); });

    let file = await new Promise((resolve, reject) => { fileEntry.file(resolve, reject); });
    
    // Tested:readAsArrayBuffer
    let resultBuf = await new Promise((resolve, reject) => { let reader = new FileReader(); reader.onloadend = function() { resolve(this.result); }; reader.readAsArrayBuffer(file); });
    expect(resultBuf).toEqual(imgBufferArray);

    // Tested:readAsDataURL
    let resultData = await new Promise((resolve) => { let reader = new FileReader(); reader.onloadend = function() { resolve(this.result); }; reader.readAsDataURL(file); });
    expect(resultData).toEqual(imgDataUri);

    // Tested:readAsBinaryString
    let resultBinString = await new Promise((resolve) => { let reader = new FileReader(); reader.onloadend = function() { resolve(this.result); }; reader.readAsBinaryString(file); });
    expect(resultBinString).toEqual(imgBinaryString);
  });

  it("resolvefilesystems", async function() {
    // Tested:resolveLocalFileSystemURI
    let root = await new Promise((resolve, reject) => { window.resolveLocalFileSystemURL(cordova.file.dataDirectory, resolve, reject); });
    expect(root.isDirectory).toBeTrue();

    let exception;
    try {
      root = await new Promise((resolve, reject) => { window.resolveLocalFileSystemURL(cordova.file.externalDataDirectory, resolve, reject); });
    } catch (e) {
      exception = e;
    }
    expect(exception).not.toBeNull();

    // Try a temp dir
    let tmp = await new Promise((resolve, reject) => { window.requestFileSystem(window.TEMPORARY, 5 * 1024 * 1024, (fs) => { resolve(fs); } )});
    expect(tmp.root.name).toBe("Temp");
    expect(tmp.root.isDirectory).toBeTrue();
  });

  /** Test: truncate */
  it("truncate", async function() {
    /** @type {DirectoryEntry} */
    let dir = await new Promise((resolve, reject) => { window.testDir.getDirectory("truncate-test", { create: true, exclusive: false }, resolve, reject) });
    
    await writeFile(`truncate-test/file-to-truncate.txt`, "a file with contents in it.");
    let result = await readAsPromise(dir, "file-to-truncate.txt");
    expect(result).toBe("a file with contents in it.");

    let fileEntry = await new Promise((resolve, reject) => { dir.getFile("file-to-truncate.txt", { create: false, exclusive: false }, resolve, reject) });
    let writer = await new Promise((resolve, reject) => { fileEntry.createWriter(resolve); });

    // Truncate 0 at the start
    await new Promise((resolve, reject) => { writer.onwriteend = resolve; writer.onerror = reject; writer.seek(0); writer.truncate(0); });
    
    result = await readAsPromise(dir, "file-to-truncate.txt");
    expect(result).toBe("");

    // Truncate 
    await writeFile(`truncate-test/file-to-truncate.txt`, "a file with contents in it.");
    await new Promise((resolve, reject) => { writer.onwriteend = resolve; writer.onerror = reject; writer.truncate(11); });
    result = await readAsPromise(dir, "file-to-truncate.txt");
    expect(result).toBe("a file with");
  });

// getFileMetadata: getFileMetadata,
// setMetadata: setMetadata,
// getParent: getParentHandler,
// resolveLocalFileSystemURI: resolveLocalFileSystemURIHandler,
// requestAllFileSystems: notifyNotSupported,
// _getLocalFilesystemPath: _getLocalFilesystemPathHandler

/** Helper functions combining multiple calls into promises. */

/**
 * 
 * @param {string} filename 
 * @param {string} contents 
 */
const writeFile = async function(filename, contents) {
  let fileEntry = await new Promise((resolve, reject) => { window.testDir.getFile(filename, {create: true, exclusive: false}, resolve, reject) });
  let writer = await new Promise((resolve, reject) => { fileEntry.createWriter(resolve); });
  let data = new Blob([contents], { type: 'text/plain' });
  await new Promise((resolve, reject) => { writer.onwriteend = resolve; writer.onerror = reject; writer.write(data); });
}

/**
 * 
 * @param {DirectoryEntry} dir 
 * @param {string} fileName 
 * @param {{ create?: boolean, exclusive?: boolean }} [flags]
 * @param {"readAsText" | "readAsDataURL"?} [operation ]
 * @returns 
 */
const readAsPromise = async function(dir, fileName, flags, operation) {
  operation = operation || "readAsText"
  var fileEntry = await DirectoryEntryGetFile(dir, fileName, flags);
  let file = await new Promise((resolve, reject) => { fileEntry.file(resolve, reject); });
  let result = await new Promise((resolve) => { let reader = new FileReader(); reader.onloadend = function() { resolve(this.result); }; reader[operation](file); });
  return result;
}

/***************** Promise versions of the calls. ************************/

/**
 * 
 * @param {DirectoryEntry} dir 
 * @param {string} fileName 
 * @param {{ create?: boolean }} flags 
 * @returns {Promise<FileEntry>}
 */
const DirectoryEntryGetFile = async function(dir, fileName, flags) {
  flags = flags || {};
  return await new Promise((resolve, reject) => { dir.getFile(fileName, flags, resolve, reject) });
}

/**
 * 
 * @param {DirectoryEntry} directoryEntry 
 * @returns {Promise<void>}
 */
const DirectoryEntryRemove = async (directoryEntry) => {
  return await new Promise((resolve, reject) => { directoryEntry.remove(resolve, reject) });
}

// DirectoryEntry.defineProperty(Array.prototype, "remove", {
//   set: function(){},
//   get: function(){
//     return removeArrayElement.bind(this);
//   }
// });

// /**
//  * 
//  * @param {DirectoryEntry} folderEntry 
//  */
// const recursiveRemoveOld = async (folderEntry) => {
// /** @type {Entry[]} */
//   let entries = await new Promise((resolve, reject) => { folderEntry.createReader().readEntries(resolve, reject); });
//   for (var entry of entries) {
//     if (entry.isDirectory) {
//       await recursiveRemove(entry);
//     }
//     await new Promise((resolve, reject) => { entry.remove(resolve, reject); });
//     // await new Promise((resolve, reject) => { setTimeout(resolve, 1000); })
//   }
// }


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
