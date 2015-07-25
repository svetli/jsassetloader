/*!!
 * Asset Loader <http://github.com/svetli/assetloader>
 * @author Svetli Nikolov
 * @version 1.0.0 (2013/1/12 11:19 PM)
 * Released under the MIT License
 */

;(function(window) {

	/**
     * AssetLoader
     *
     * @type 	object
     */
	var loader = {};

	/**
     * Asset Group
     *
     * @param 	array 	data 	item to load
     * @return 	object 	config	load settings
     */
	function AssetGroup(data, config) {

		var group = {};
		group.data = data;
		group.stripPath = false;

		if (config.onComplete) {
			group.onComplete = config.onComplete;
		}

		if (config.onUpdate) {
			group.onUpdate = config.onUpdate;
		}

		if (config.customPath !== null) {
			group.customPath = config.customPath;
		}

		if (config.stripPath) {
			group.stripPath = config.stripPath;
		}

		return group;
	};

	//--------------------------------------------------------------------------------------
    // Private Vars
    //--------------------------------------------------------------------------------------

	function startLoading() {

		var que			= loader.que[0],
			data 		= que.data,
			oncomplete 	= que.onComplete,
			onupdate	= que.onUpdate,
			customPath	= que.customPath,
			queues		= [],
			queuesCount = 0,
			completed	= 0,
			completeAll	= false,
			asset,
			img;

		loader.loaded = 0;

		function onLoad(e) {
			e.currentTarget.removeEventListener('load', calculatePercentage, true);
			e.currentTarget.removeEventListener('error', calculatePercentage, true);
			completed++;
			calculatePercentage();
		}

		function onLoadError(e) {
			throw Error('AssetLoader -> Error, can\'t load ' + e.currentTarget.src);
		}

		function calculatePercentage() {
			loader.loaded =  Math.ceil(100 * (completed / queuesCount));

			if (onupdate != null) {
				onupdate(loader.loaded);
			}

			if (completed == queuesCount) {
				if (oncomplete) {
					oncomplete();
				}

				loader.que.shift();

				if(loader.que.length > 0) {
					if(completeAll) {
						completeAll = false;
						loader.busy = false;
						if (oncomplete) {
							oncomplete();
						}
					}
					loader.busy = true;
				} else {
					loader.busy = false;
				}
			}
		}

		for (var i=0; i < data.length; i++) {
			asset = loader.stripExtension(data[i]);
			if (!loader.assetExist(asset)) {
				queues.push(data[i]);
				queuesCount++;
			}
		}

		(function() {
			if (queues.length > 0) {
				for (var i=0; i < queues.length; i++) {
					img = new Image;
					img.addEventListener("load", onLoad, true);
					img.addEventListener("error", onLoadError, true);
					img.style.position = "absolute";

					asset = queues[i];

					if(/\//.test(asset) && que.stripPath) {
						asset = loader.stripPath(queues[i]);
					}
					
					asset = loader.stripExtension(asset);

					if (customPath != null) {
						img.src = customPath + queues[i];
					} else {
						img.src = loader.path + queues[i];
					}

					loader.assets.push({
						asset: img,
						id: asset
					});
				}
			} else {
				calculatePercentage();
			}
		})();
	};

    //--------------------------------------------------------------------------------------
    // Public (API)
    //--------------------------------------------------------------------------------------

	/**
     * Initialize.
     *
     * @param 	string path to asset folder
     * @return 	void
     * @example AssetLoader.init('path/to/asset/folder')
     */
	loader.init = function(path) {
		if (!this.initialized) {
			this.assets 	 = [];
			this.que		 = [];
			this.busy 		 = false;
			this.path 		 = path;
			this.loaded 	 = 0;
			this.initialized = true;
		}
	};

	/**
     * Add asset group to load queue.
     *
     * @param 	array 		data 	items to load
     * @param 	object 		config 	loading settings
     * @param 	bool 		load 	autoloading
     * @return 	AssetGroup
     * @example AssetLoader.addGroup('img1.jpg img2.jpg img3.jpg'.split(" "), {
	 *				onComplete: looadComplete,
	 *				onUpdate: loadUpdate, }, true);
     */
	loader.addGroup = function(data, config, autoload) {

		if (!this.initialized) {
			throw Error('You need to initialize loader before adding a group.');
		}

		var group = new AssetGroup(data, config);

		if ( autoload ) {
			this.loadGroup(group);
		}

		return group;
	};

	/**
     * Loading group into queue.
     *
     * @param object 	group 	AssetGroup
     * @return void
     */
	loader.loadGroup = function(group) {

		if (!this.initialized) {
			throw Error('You need to initialize loader before loading a group.');
		}

		if (this.busy) {
			this.que.push(group);
		} else {
			this.busy = true;
			this.que.push(group);
			startLoading();
		}
	};

	/**
     * Remove group from queue.
     *
     * @param object 	group 	AssetGroup
     * @return void
     */
	loader.removeGroup = function(group) {

		if (!this.initialized) {
			throw Error('You need to initialize loader before removing a group.');
		}

		var itm, asset;

		for (var i=0; i < group.data.length;) {
			for (i=0; i < this.assets.length; i++) {
				itm = group.data.shift();
				
				if (group.stripPath) {
					itm = this.stripPath(itm);
				}
				
				itm = this.stripExtension(itm);
				asset = this.assets[i];
				
				if (asset && asset.id == itm) {
					this.assets.splice(i, 1);
					break;
				}
			}
		}
	};

	/**
     * Retrieve loaded asset.
     *
     * @param 	string 	id 	asset name
     * @return 	string 		asset data
     * @example AssetLoader.getAsset('img1');
     */
	loader.getAsset = function(id) {

		if (!this.initialized) {
			throw Error('You need to initialize loader before attempting to retrive an asset - id: ' + id);
		}
		
		var asset = null,
			found = false,
			itm;

		id = this.stripExtension(id);

		for (var i=0; i < this.assets.length; i++) {
			if (id === this.assets[i].id) {
				itm = this.assets[i].asset;
				found = true;
				asset = itm.cloneNode(true);
				asset.width = itm.width;
				asset.height = itm.height;
				asset.style.position = 'absolute';
				break;
			}
		}

		if (found !== true) {
			throw Error('AssetLoader -> asset with id: ' + id + ', not found.');
		}

		return asset;
	};

	/**
     * Remove asset from queue.
     *
     * @param 	string 	id 	asset name
     * @return 	void
     * @example AssetLoader.removeAsset('img1');
     */
	loader.removeAsset = function(id) {

		if (!this.initialized) {
			throw Error('You need to initialize loader before attempting to remove an asset - id: ' + id);
		}

		id = this.stripExtension(id);

		for (var i=0; i < this.assets.length; i++) {
			if (id === this.assets[i].id) {
				this.assets.splice(i, 1);
			}
		}
	};

	/**
     * Asset already exists
     *
     * @param string 	id 	asset name
     * @return bool 	
     */
	loader.assetExist = function(id) {
		for (var i=0; i < this.assets.length; i++) {
			if (id === this.assets[i].id) {
				return true;
			}
		}
		return false;
	};

	/**
     * Strip asset path
     *
     * @param string 	path 	path to asset
     * @return string
     */
	loader.stripPath = function(path) {
		return path.replace(RegExp("^.*[/]", "g"), "");
	};

	/**
     * Get extension from file
     *
     * @param string 	path 	path to asset
     * @return string 	extension
     */
	loader.stripExtension = function(path) {
		return path.split(".")[0];
	};

    //--------------------------------------------------------------------------------------
    // Module export
    //--------------------------------------------------------------------------------------

	if ( typeof module === "object" && module && typeof module.exports === "object" ) {
		module.exports = loader;
	} else {
		window.AssetLoader = loader;
		if ( typeof define === "function" && define.amd ) {
			define("AssetLoader", [], function () { return loader; } );
		}
	}

}(window));