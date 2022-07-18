/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

// Wait for the deviceready event before using any of Cordova's device APIs.
// See https://cordova.apache.org/docs/en/latest/cordova/events/events.html#deviceready

document.addEventListener('deviceready', onDeviceReady, false);
function onDeviceReady() {
    console.log('Running cordova-' + cordova.platformId + '@' + cordova.version);
    return;
    // Cordova is now initialized. Have fun!


    // window.document.body.innerText = "DONE";

    console.log(cordova.file);

    
    function onErrorReadFile(e) {
        console.error(e);
    }

    function displayFileData(data) {
        window.document.body.innerText = window.document.body.innerText + "\n" + data;
    }

    // https://cordova.apache.org/docs/en/11.x/reference/cordova-plugin-file/index.html
    function createFile(dirEntry, fileName, isAppend) {
        // Creates a new file or returns the file if it already exists.
        dirEntry.getFile(fileName, {create: true, exclusive: false}, function(fileEntry) {
    
            writeFile(fileEntry, null, isAppend);
    
        }, onErrorReadFile);
    
    }

    function readFile(fileEntry) {

        fileEntry.file(function (file) {
            var reader = new FileReader();
    
            reader.onloadend = function() {
                console.log("Successful file read: " + this.result);
                displayFileData(fileEntry.fullPath + ": " + this.result);
            };
    
            reader.readAsText(file);
    
        }, onErrorReadFile);
    }

    function writeFile(fileEntry, dataObj) {
        // Create a FileWriter object for our FileEntry (log.txt).
        fileEntry.createWriter(function (fileWriter) {
    
            fileWriter.onwriteend = function() {
                console.log("Successful file write...");
                readFile(fileEntry);
            };
    
            fileWriter.onerror = function (e) {
                console.log("Failed file write: " + e.toString());
            };
    
            // If data object is not passed in,
            // create a new Blob instead.
            if (!dataObj) {
                dataObj = new Blob(['some file data'], { type: 'text/plain' });
            }
    
            fileWriter.write(dataObj);
        });
    }

    // window.requestFileSystem(window.TEMPORARY, 5 * 1024 * 1024, function (fs) {
    //     console.log('file system open: ' + fs.name);
    //     createFile(fs.root, "newTempFile.txt", false);
    // }, (e) => { throw e; });
}
