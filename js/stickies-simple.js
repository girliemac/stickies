/**
 * stickies-simple.js - Simplified version of stickies.js
 * Unlike stickies.js, this is coded only with the latest standard syntax of IndexedDB,
 * and does NOT support the browsers that use deprecated syntax:
 * BB10, Chrome < 23 (including Chrome Mobile v18, the first Chrome for Android)
 * Also, the animation effect is removed from this version.
 **/

(function(){
	
	var db;
	
	// Supported without prefix: IE10, Moz16+, Opera14 (Webkit).
    var indexedDB = window.indexedDB || window.webkitIndexedDB || window.mozIndexedDB;
    
    var data = {};
    var stickie;
   
	function init() {
	   stickie = document.getElementById('stickieField');
	   stickie.addEventListener('keypress', addItem);   
	   
	   openDB(); 
      
	}
    
    function openDB() {
    	if(typeof indexedDB === 'undefined') {
        	// iDB unsupported -- iOS, Opera, other older browsers
        	alert('Your Browser does not support IndexedDB!');
        	return;
        }
        
        if(indexedDB === null) {
        	// possibly running the app from local file on old Firefox
        	alert('IndexedDB cannot run locally on some browsers. Try running this app from a server.')
        	return;
        }
        
        var req = indexedDB.open('stickieDB'); 
        req.onsuccess = function(e) {
        	db = e.target.result;
        	getItems();
        };
        
        req.onfailure = function(e) {
        	console.log(e);
        };
        
        req.onupgradeneeded = function(e) {
		    createObjStore(e.target.result);
		};
    }

	function createObjStore(db) {
	    db.createObjectStore('stickie', {keyPath: 'id', autoIncrement: true});
    }
    
    function getItems() {
	    var transaction = db.transaction('stickie', 'readonly');
        var objStore = transaction.objectStore('stickie');
        
        // Get everything in object store;
        var cursorReq = objStore.openCursor();
        
        var arr = [];
  
        cursorReq.onsuccess = function(e) {

        	var cursor = e.target.result;
    	
        	if(cursor) {
		        arr.push(cursor.value);
		        cursor.continue();
		    } else {
            	render(arr);
	        }
        }
        cursorReq.onerror = function(e) {
        	console.log(e);
        };
    }


    function addItem(e) {
    	if(e.keyCode != 13) return;
   
    	if(stickie.value == '') return;
    	
		data.item = stickie.value;
		data.created = new Date();
			
	    var transaction = db.transaction('stickie', 'readwrite');	    
        var objStore = transaction.objectStore('stickie');      
        var req = objStore.put(data);
               
        req.onsuccess = function(e) {
        	getItems();
        };
        req.onfailure = function(e) {
        	console.log(e);
        };
    }
    
    function deleteItem(id) {
	    var transaction = db.transaction('stickie', 'readwrite');
        var objStore = transaction.objectStore('stickie');
      
        var req = objStore.delete(id);
      
        req.onsuccess = function(e) {
        	console.log('Deleted ID = '+id);
        	getItems();
        };
        req.onerror = function(e) {
        	console.log('Error deleting: ', e);
        };
        req.onblocked = function(e){		
			console.log('Deleting DB Blocked: ', e);
		};
    }
    
    
    /**
     * Rendering the data in DOM (sans CSS animations)
     */
    
    function render(items) {
    	
    	var ul = document.getElementById('stickiesList');
    	ul.innerHTML = '';
    	
    	items.reverse();
    	
    	for (var i = 0; i < items.length; i++) {
			var note = document.createElement('li');
			
			var p = document.createElement('p');
			var textNode = document.createTextNode(items[i].item);
			p.appendChild(textNode);
			
			var x = document.createElement('a');
			x.textContent = 'x';
			x.id = items[i].id;
			
			note.appendChild(p);
			note.appendChild(x);
			
			x.addEventListener('click', function(e) {
				var id = parseInt(e.target.id);
				deleteItem(id);
			}, false);

			ul.appendChild(note);
			
	    }
	    stickie.value = '';
			
    }
    
    
    init();

})();

