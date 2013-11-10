/**
 * stickies.js
 * This code includes the deprecated syntax for IndexedDB API, for broader browser support.
 *
 * See stickies-simple.js for the simplified code.
 **/
 
(function(){
	
	var db;
	
	// Supported without prefix: IE10, Moz16+, Opera14 (webkit).
	// Supported with Prefix: Chrome, BlackBerry10, Firefox15 and IE10dev
	// Unsupported: Opera Presto (< 14), Safari 
	
    var indexedDB = window.indexedDB || window.webkitIndexedDB || window.mozIndexedDB || window.msIndexedDB;
    var IDBKeyRange = window.IDBKeyRange || window.webkitIDBKeyRange;
    
    // FF, IE10 and Chrome21+ use strings while older Chrome used constants
    var IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction;
    if(IDBTransaction) {
	    IDBTransaction.READ_WRITE = IDBTransaction.READ_WRITE || 'readwrite';
	    IDBTransaction.READ_ONLY = IDBTransaction.READ_ONLY || 'readonly';
	}
 
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
        	// possibly running the app from local file on older Firefox
        	alert('IndexedDB cannot run locally on some browsers. Try running this app from a server.')
        	return;
        }
        
        var req = indexedDB.open('stickieDB'); 
        req.onsuccess = function(e) {
        	db = e.target.result;
        	console.log(db);
        	
        	// For BB10 and Chrome < 23 (including Chrome Mobile v18) -- newer Chrome & FF deprecated it and use onupgradeneeded event
        	
        	if(typeof db.setVersion === 'function') {
	        	console.log('browser using deprecated setVersion');
	        	
	        	if(db.version != 1) {
	        		console.log('setting new version with setVersion');
		            var setVersionReq = db.setVersion(1);
		            
		            setVersionReq.onsuccess = function(e) {
		                createObjStore(db);
		                e.target.transaction.oncomplete = function() {
			                getItems();
          				};
		            };
		         
		        } else { // Chrome >= 23
			        getItems();
		        }
		        
        	} else { // Firefox, IE10
	        	getItems();
        	}
        };
        
        req.onfailure = function(e) {
        	console.log(e);
        };
        
        // Newer browsers only - FF, Chrome (newer than ?), IE10
        req.onupgradeneeded = function(e) {
        	console.log('onupgradeneeded');
		    createObjStore(e.target.result);
		};
    }

	function createObjStore(db) {
	    db.createObjectStore('stickie', {keyPath: 'id', autoIncrement: true});
    }
    
    function getItems(anim) {
	    var transaction = db.transaction('stickie', IDBTransaction.READ_ONLY);
        var objStore = transaction.objectStore('stickie');
        console.log(objStore); 
        
        // Get everything in object store;
        var cursorReq = objStore.openCursor();
        
        var arr = [];
  
        cursorReq.onsuccess = function(e) {

        	var cursor = e.target.result;
    	
        	if(cursor) {
		        arr.push(cursor.value);
		        cursor.continue();
		    } else {
            	render(arr, anim);
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
			
	    var transaction = db.transaction('stickie', IDBTransaction.READ_WRITE);	    
        var objStore = transaction.objectStore('stickie');      
        var req = objStore.put(data);
               
        req.onsuccess = function(e) {
        	getItems('add');
        };
        req.onfailure = function(e) {
        	console.log(e);
        };
    }
    
    function deleteItem(id) {
	    var transaction = db.transaction('stickie', IDBTransaction.READ_WRITE);
        var objStore = transaction.objectStore('stickie');
      
        var req = objStore.delete(id);
      
        req.onsuccess = function(e) {
        	console.log('Deleted ID = '+id);
        	getItems('delete');
        };
        req.onerror = function(e) {
        	console.log('Error deleting: ', e);
        };
        req.onblocked = function(e){		
			console.log('Deleting DB Blocked: ', e);
		};
    }
    
    
    /**
     * Rendering the data in DOM (with CSS animations)
     */
    
    function render(items, animation) {
    	
    	var ul = document.getElementById('stickiesList');
    	ul.innerHTML = '';
    	ul.className = (animation) ? animation : 'no-anim';
    	
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
				e.target.parentNode.style.setProperty('-webkit-transition', 'opacity 1s ease-out');
				e.target.parentNode.style.setProperty('-moz-transition', 'opacity 1s ease-out');
				e.target.parentNode.style.setProperty('transition', 'opacity 1s ease-out');
				e.target.parentNode.style.opacity = '0';
				setTimeout(function(){deleteItem(id);}, 800);
			}, false);

			ul.appendChild(note);
			
	    }
	    stickie.value = '';
			
    }
    
    
    init();

})();

