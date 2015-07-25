asset_loader.js
===============
JavaScript library that makes it easy to load assets

## Usage
```js

Initialize path

```js
AssetLoader.init('path/to/assets/');

Initialize group with autoload

```js
var group = AssetLoader.addGroup('img1.jpg img2.jpg img3.jpg'.split(" "), {
	onComplete: assetLoadComplete,
	onUpdate: assetLoadUpdate,
	stripPath: true
}, true);

Initialize group and load manual

```js
var group = AssetLoader.addGroup('img1.jpg img2.jpg img3.jpg'.split(" "), {
	onComplete: assetLoadComplete,
	onUpdate: assetLoadUpdate,
	stripPath: true
}, false);

AssetLoader.loadGroup(group);
