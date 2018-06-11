if(!self.bigshot){bigshot={};bigshot.Object={extend:function(b,c){for(var a in c.prototype){if(b.prototype[a]){b.prototype[a]._super=c.prototype[a]}else{b.prototype[a]=c.prototype[a]}}},resolve:function(b){var e=b.split(".");var a=self;for(var d=0;d<e.length;++d){a=a[e[d]]}return a},validate:function(a,b){},alertr:function(b){var c="";for(var a in b){c+=a+":"+b[a]+"\n"}alert(c)},logr:function(b){var c="";for(var a in b){c+=a+":"+b[a]+"\n"}if(console){console.log(c)}}};bigshot.Browser=function(){this.requestAnimationFrameFunction=window.requestAnimationFrame||window.mozRequestAnimationFrame||window.webkitRequestAnimationFrame||window.msRequestAnimationFrame||function(b,a){return setTimeout(b,0)}};bigshot.Browser.prototype={removeAllChildren:function(a){a.innerHTML=""},mouseEnter:function(b){var a=this.isAChildOf;return function(c){var d=c.relatedTarget;if(this===d||a(this,d)){return}b.call(this,c)}},isAChildOf:function(b,a){if(b===a){return false}while(a&&a!==b){a=a.parentNode}return a===b},unregisterListener:function(d,b,c,a){if(typeof(d.removeEventListener)!="undefined"){d.removeEventListener(b,c,a)}else{if(typeof(d.detachEvent)!="undefined"){d.detachEvent("on"+b,c)}}},registerListener:function(a,b,d,c){if(typeof a.addEventListener!="undefined"){if(b==="mouseenter"){a.addEventListener("mouseover",this.mouseEnter(d),c)}else{if(b==="mouseleave"){a.addEventListener("mouseout",this.mouseEnter(d),c)}else{a.addEventListener(b,d,c)}}}else{if(typeof a.attachEvent!="undefined"){a.attachEvent("on"+b,d)}else{a["on"+b]=d}}},stopEventBubbling:function(a){if(a){if(a.stopPropagation){a.stopPropagation()}else{a.cancelBubble=true}}},stopEventBubblingHandler:function(){var a=this;return function(b){a.stopEventBubbling(b);return false}},stopMouseEventBubbling:function(a){this.registerListener(a,"mousedown",this.stopEventBubblingHandler(),false);this.registerListener(a,"mouseup",this.stopEventBubblingHandler(),false);this.registerListener(a,"mousemove",this.stopEventBubblingHandler(),false)},getElementSize:function(b){var a={};if(b.clientWidth){a.w=b.clientWidth}if(b.clientHeight){a.h=b.clientHeight}return a},browserIsViewporting:function(){if(window.innerWidth<=screen.width){return false}else{return true}},getDevicePixelScale:function(){if(this.browserIsViewporting()){return screen.width/window.innerWidth}else{return 1}},requestAnimationFrame:function(c,a){var b=this.requestAnimationFrameFunction;b(c,a)},getElementPosition:function(b){var a=new Object();a.x=0;a.y=0;var c=b;while(c){a.x+=c.offsetLeft;a.y+=c.offsetTop;if(c.clientLeft){a.x+=c.clientLeft}if(c.clientTop){a.y+=c.clientTop}if(c.x){a.x+=c.x}if(c.y){a.y+=c.y}c=c.offsetParent}return a},createXMLHttpRequest:function(){try{return new ActiveXObject("Msxml2.XMLHTTP")}catch(a){}try{return new ActiveXObject("Microsoft.XMLHTTP")}catch(a){}try{return new XMLHttpRequest()}catch(a){}alert("XMLHttpRequest not supported");return null},makeOpacityTransition:function(a,b){if(a.style.WebkitTransitionProperty!=undefined){a.style.opacity=1;a.style.WebkitTransitionProperty="opacity";a.style.WebkitTransitionTimingFunction="linear";a.style.WebkitTransitionDuration="1s";setTimeout(function(){a.addEventListener("webkitTransitionEnd",function(){b()});a.style.opacity=0},0)}else{a.style.opacity=0;b()}}};bigshot.EventDispatcher=function(){this.eventListeners={}};bigshot.EventDispatcher.prototype={addEventListener:function(a,b){if(this.eventListeners[a]==undefined){this.eventListeners[a]=new Array()}this.eventListeners[a].push(b)},removeEventListener:function(a,d){if(this.eventListeners[a]!=undefined){var c=this.eventListeners[a];for(var b=0;b<c.length;++b){if(c[b]===listener){c.splice(b,1);if(c.length==0){delete this.eventListeners[a]}break}}}},fireEvent:function(b,a){if(this.eventListeners[b]!=undefined){var d=this.eventListeners[b];for(var c=0;c<d.length;++c){d[c](a)}}}};bigshot.Event=function(b){this.bubbles=false;this.cancelable=false;this.currentTarget=null;this.defaultPrevented=false;this.target=null;this.timeStamp=new Date().getTime();this.type=null;this.isTrusted=false;for(var a in b){this[a]=b[a]}};bigshot.Event.prototype={preventDefault:function(){this.defaultPrevented=true}};bigshot.TimedWeakReference=function(b,c,a){this.object=null;this.hasObject=false;this.fnCreate=b;this.fnDispose=c;this.lastAccess=new Date().getTime();this.hasTimer=false;this.interval=a};bigshot.TimedWeakReference.prototype={dispose:function(){this.clear()},get:function(){if(!this.hasObject){this.hasObject=true;this.object=this.fnCreate();this.startTimer()}this.lastAccess=new Date().getTime();return this.object},clear:function(){if(this.hasObject){this.hasObject=false;this.fnDispose(this.object);this.object=null;this.stopTimer()}},stopTimer:function(){if(this.hasTimer){clearTimeout(this.timerId);this.hasTimer=false}},startTimer:function(){if(!this.hasTimer){var a=this;this.hasTimer=true;this.timerId=setTimeout(function(){a.hasTimer=false;a.update()},this.interval)}},update:function(){if(this.hasObject){var a=new Date().getTime();if(a-this.lastAccess>this.interval){this.clear()}else{this.startTimer()}}}};bigshot.ImageEvent=function(a){bigshot.Event.call(this,a)};bigshot.ImageEvent.prototype={};bigshot.Object.extend(bigshot.ImageEvent,bigshot.Event);bigshot.VREvent=function(a){bigshot.Event.call(this,a)};bigshot.VREvent.prototype={};bigshot.Object.extend(bigshot.VREvent,bigshot.Event);bigshot.FullScreen=function(a){this.container=a;this.isFullScreen=false;this.savedBodyStyle=null;this.savedParent=null;this.savedSize=null;this.expanderDiv=null;this.restoreSize=false;this.onCloseHandlers=new Array();this.onResizeHandlers=new Array();var b=function(d,e){for(var c=0;c<e.length;++c){if(d[e[c]]){return e[c]}}return null};this.requestFullScreen=b(a,["requestFullScreen","mozRequestFullScreen","webkitRequestFullScreen"]);this.cancelFullScreen=b(document,["cancelFullScreen","mozCancelFullScreen","webkitCancelFullScreen"]);this.restoreSize=this.requestFullScreen!=null};bigshot.FullScreen.prototype={browser:new bigshot.Browser(),getRootElement:function(){return this.div},addOnClose:function(a){this.onCloseHandlers.push(a)},onClose:function(){for(var a=0;a<this.onCloseHandlers.length;++a){this.onCloseHandlers[a]()}},addOnResize:function(a){this.onResizeHandlers.push(a)},onResize:function(){for(var a=0;a<this.onResizeHandlers.length;++a){this.onResizeHandlers[a]()}},open:function(){this.isFullScreen=true;if(this.requestFullScreen){return this.openRequestFullScreen()}else{return this.openCompat()}},openRequestFullScreen:function(){this.savedSize={width:this.container.style.width,height:this.container.style.height};this.container.style.width="100%";this.container.style.height="100%";var a=this;if(this.requestFullScreen=="mozRequestFullScreen"){var c=function(){a.container.removeEventListener("mozfullscreenerror",c);a.isFullScreen=false;a.exitFullScreenHandler();a.onClose()};this.container.addEventListener("mozfullscreenerror",c);var b=function(){if(document.mozFullScreenElement!==a.container){document.removeEventListener("mozfullscreenchange",b);a.exitFullScreenHandler()}else{a.onResize()}};document.addEventListener("mozfullscreenchange",b)}else{var b=function(){if(document.webkitCurrentFullScreenElement!==a.container){a.container.removeEventListener("webkitfullscreenchange",b);a.exitFullScreenHandler()}else{a.onResize()}};this.container.addEventListener("webkitfullscreenchange",b)}this.exitFullScreenHandler=function(){if(a.isFullScreen){a.isFullScreen=false;document[a.cancelFullScreen]();if(a.restoreSize){a.container.style.width=a.savedSize.width;a.container.style.height=a.savedSize.height}a.onResize();a.onClose()}};this.container[this.requestFullScreen]()},openCompat:function(){this.savedParent=this.container.parentNode;this.savedSize={width:this.container.style.width,height:this.container.style.height};this.savedBodyStyle=document.body.style.cssText;document.body.style.overflow="hidden";this.expanderDiv=document.createElement("div");this.expanderDiv.style.position="absolute";this.expanderDiv.style.top="0px";this.expanderDiv.style.left="0px";this.expanderDiv.style.width=Math.max(window.innerWidth,document.documentElement.clientWidth)+"px";this.expanderDiv.style.height=Math.max(window.innerHeight,document.documentElement.clientHeight)+"px";document.body.appendChild(this.expanderDiv);this.div=document.createElement("div");this.div.style.position="fixed";this.div.style.top=window.pageYOffset+"px";this.div.style.left=window.pageXOffset+"px";this.div.style.width=window.innerWidth+"px";this.div.style.height=window.innerHeight+"px";this.div.style.zIndex=9998;this.div.appendChild(this.container);document.body.appendChild(this.div);var c=this;var b=function(f){setTimeout(function(){c.div.style.width=window.innerWidth+"px";c.div.style.height=window.innerHeight+"px";setTimeout(function(){c.onResize()},1)},1)};var d=function(f){c.expanderDiv.style.width=Math.max(window.innerWidth,document.documentElement.clientWidth)+"px";c.expanderDiv.style.height=Math.max(window.innerHeight,document.documentElement.clientHeight)+"px";setTimeout(function(){c.div.style.top=window.pageYOffset+"px";c.div.style.left=window.pageXOffset+"px";c.div.style.width=window.innerWidth+"px";c.div.style.height=window.innerHeight+"px";setTimeout(function(){c.onResize()},1)},1)};var a=function(f){if(f.keyCode==27){c.exitFullScreenHandler()}};this.exitFullScreenHandler=function(){c.isFullScreen=false;c.browser.unregisterListener(document,"keydown",a);c.browser.unregisterListener(window,"resize",b);c.browser.unregisterListener(document.body,"orientationchange",d);if(c.restoreSize){c.container.style.width=c.savedSize.width;c.container.style.height=c.savedSize.height}document.body.style.cssText=c.savedBodyStyle;c.savedParent.appendChild(c.container);document.body.removeChild(c.div);document.body.removeChild(c.expanderDiv);c.onResize();c.onClose();setTimeout(function(){c.onResize()},1)};this.browser.registerListener(document,"keydown",a,false);this.browser.registerListener(window,"resize",b,false);this.browser.registerListener(document.body,"orientationchange",d,false);this.onResize();return this.exitFullScreenHandler},close:function(){this.exitFullScreenHandler()}};bigshot.DataLoader=function(){};bigshot.DataLoader.prototype={loadImage:function(a,b){},loadXml:function(a,b,c){}};bigshot.DefaultDataLoader=function(b,a){this.maxRetries=b;this.crossOrigin=a;if(!this.maxRetries){this.maxRetries=0}};bigshot.DefaultDataLoader.prototype={browser:new bigshot.Browser(),loadImage:function(a,d){var c=document.createElement("img");c.retries=0;if(this.crossOrigin!=null){c.crossOrigin=this.crossOrigin}var b=this;this.browser.registerListener(c,"load",function(){if(d){d(c)}},false);this.browser.registerListener(c,"error",function(){c.retries++;if(c.retries<=b.maxRetries){setTimeout(function(){c.src=a},c.retries*1000)}else{if(d){d(null)}}},false);c.src=a;return c},loadXml:function(c,a,f){for(var e=0;e<=this.maxRetries;++e){var d=this.browser.createXMLHttpRequest();d.open("GET",c,false);d.send(null);if(d.status==200){var b=d.responseXML;if(b!=null){if(f){f(b)}return b}}if(e==that.maxRetries){if(f){f(null)}return null}}}};bigshot.Object.validate("bigshot.DefaultDataLoader",bigshot.DataLoader);bigshot.CachingDataLoader=function(){this.cache={};this.requested={};this.requestedTiles={}};bigshot.CachingDataLoader.prototype={browser:new bigshot.Browser(),loadImage:function(a,d){if(this.cache[a]){if(d){d(this.cache[a])}return this.cache[a]}else{if(this.requested[a]){if(d){this.requested[a].push(d)}return this.requestedTiles[a]}else{var c=this;this.requested[a]=new Array();if(d){this.requested[a].push(d)}var b=document.createElement("img");this.requestedTiles[a]=b;this.browser.registerListener(b,"load",function(){var f=c.requested[a];delete c.requested[a];delete c.requestedTiles[a];c.cache[a]=b;for(var e=0;e<f.length;++e){f[e](b)}},false);b.src=a;return b}}},loadXml:function(a,c,f){if(this.cache[a]){if(f){f(this.cache[a])}return this.cache[a]}else{if(this.requested[a]&&c){if(f){this.requested[a].push(f)}}else{var e=this.browser.createXMLHttpRequest();if(!this.requested[a]){this.requested[a]=new Array()}if(c){if(f){this.requested[a].push(f)}}var d=this;var b=function(){if(d.requested[a]){var g=null;if(e.status==200){g=e.responseXML}var k=d.requested[a];delete d.requested[a];d.cache[a]=g;for(var j=0;j<k.length;++j){k[j](g)}}return g};if(c){e.onreadystatechange=function(){if(e.readyState==4){b()}};e.open("GET",a,true);e.send()}else{e.open("GET",a,false);e.send();return b()}}}}};bigshot.Object.validate("bigshot.CachingDataLoader",bigshot.DataLoader);bigshot.Hotspot=function(a,e,b,d){var c=document.createElement("div");c.style.position="absolute";c.style.overflow="visible";this.element=c;this.x=a;this.y=e;this.w=b;this.h=d};bigshot.Hotspot.prototype={browser:new bigshot.Browser(),layout:function(c,e,d){var g=this.x*d+c;var f=this.y*d+e;var a=this.w*d;var b=this.h*d;this.element.style.top=f+"px";this.element.style.left=g+"px";this.element.style.width=a+"px";this.element.style.height=b+"px"},getElement:function(){return this.element}};bigshot.PointHotspot=function(a,i,b,e,f,g,c){bigshot.Hotspot.call(this,a,i,b,e);this.xo=f;this.yo=g;if(c){var d=this.getElement();d.style.backgroundImage="url('"+c+"')";d.style.backgroundRepeat="no-repeat"}};bigshot.PointHotspot.prototype={getLabel:function(){return this.label},layout:function(a,c,b){var e=this.x*b+a+this.xo;var d=this.y*b+c+this.yo;this.element.style.top=d+"px";this.element.style.left=e+"px";this.element.style.width=this.w+"px";this.element.style.height=this.h+"px"}};bigshot.Object.extend(bigshot.PointHotspot,bigshot.Hotspot);bigshot.Layer=function(){};bigshot.Layer.prototype={getContainer:function(){},setMaxTiles:function(a,b){},resize:function(a,b){},layout:function(g,e,f,a,d,c,i,b){}};bigshot.LabeledHotspot=function(a,e,b,c,d){bigshot.Hotspot.call(this,a,e,b,c);this.label=document.createElement("div");this.label.style.position="relative";this.label.style.display="inline-block";this.getElement().appendChild(this.label);this.label.innerHTML=d;this.labelSize=this.browser.getElementSize(this.label)};bigshot.LabeledHotspot.prototype={getLabel:function(){return this.label},layout:function(c,e,d){this.layout._super.call(this,c,e,d);var a=this.w*d;var b=this.h*d;this.label.style.top=(b+4)+"px";this.label.style.left=((a-this.labelSize.w)/2)+"px"}};bigshot.Object.extend(bigshot.LabeledHotspot,bigshot.Hotspot);bigshot.LinkHotspot=function(a,f,b,d,e,c){bigshot.LabeledHotspot.call(this,a,f,b,d,e);this.browser.registerListener(this.getElement(),"click",function(){document.location.href=c})};bigshot.Object.extend(bigshot.LinkHotspot,bigshot.LabeledHotspot);bigshot.HotspotLayer=function(a){this.image=a;this.hotspots=new Array();this.browser=new bigshot.Browser();this.container=a.createLayerContainer();this.parentContainer=a.getContainer();this.resize(0,0)};bigshot.HotspotLayer.prototype={getContainer:function(){return this.container},resize:function(a,b){this.container.style.width=this.parentContainer.clientWidth+"px";this.container.style.height=this.parentContainer.clientHeight+"px"},layout:function(k,d,j,e,a,l,b,g){var c=Math.pow(2,this.image.getZoom());d-=b*e;j-=b*a;for(var f=0;f<this.hotspots.length;++f){this.hotspots[f].layout(d,j,c)}},setMaxTiles:function(b,a){},addHotspot:function(a){this.container.appendChild(a.getElement());this.hotspots.push(a)}};bigshot.Object.validate("bigshot.HotspotLayer",bigshot.Layer);bigshot.TileLayer=function(d,c,a,b,e){this.rows=new Array();this.browser=new bigshot.Browser();this.container=d.createLayerContainer();this.parentContainer=d.getContainer();this.parameters=c;this.w=a;this.h=b;this.imageTileCache=e;this.resize(a,b);return this};bigshot.TileLayer.prototype={getContainer:function(){return this.container},resize:function(a,d){this.container.style.width=this.parentContainer.clientWidth+"px";this.container.style.height=this.parentContainer.clientHeight+"px";this.pixelWidth=this.parentContainer.clientWidth;this.pixelHeight=this.parentContainer.clientHeight;this.w=a;this.h=d;this.rows=new Array();this.browser.removeAllChildren(this.container);for(var f=0;f<d;++f){var g=new Array();for(var i=0;i<a;++i){var b=document.createElement("div");b.style.position="absolute";b.style.overflow="hidden";b.style.width=this.container.clientWidth+"px";b.style.height=this.container.clientHeight+"px";var e=document.createElement("div");e.style.position="relative";e.style.border="hidden";e.style.visibility="hidden";e.bigshotData={visible:false};g.push(e);this.container.appendChild(b);b.appendChild(e)}this.rows.push(g)}},layout:function(a,p,d,z,f,m,o,e){a=Math.min(0,Math.ceil(a));this.imageTileCache.resetUsed();var g=d;var b=0;for(var k=0;k<this.h;++k){var i=p;for(var s=0;s<this.w;++s){var v=this.rows[k][s];var j=v.bigshotData;if(i+m<0||i>this.pixelWidth||g+m<0||g>this.pixelHeight){if(j.visible){j.visible=false;v.style.visibility="hidden"}}else{b++;v.style.left=i+"px";v.style.top=g+"px";v.style.width=m+"px";v.style.height=m+"px";v.style.opacity=e;if(!j.visible){j.visible=true;v.style.visibility="visible"}var u=s+z;var t=k+f;if(this.parameters.wrapX){if(u<0||u>=this.imageTileCache.maxTileX){u=(u+this.imageTileCache.maxTileX)%this.imageTileCache.maxTileX}}if(this.parameters.wrapY){if(t<0||t>=this.imageTileCache.maxTileY){t=(t+this.imageTileCache.maxTileY)%this.imageTileCache.maxTileY}}var n=u+"_"+t+"_"+a;var q=u<0||u>=this.imageTileCache.maxTileX||t<0||t>=this.imageTileCache.maxTileY;if(q){if(!j.isOutside){var l=this.imageTileCache.getImage(u,t,a);this.browser.removeAllChildren(v);v.appendChild(l);j.image=l}j.isOutside=true;j.imageKey="EMPTY";j.image.style.width=m+"px";j.image.style.height=m+"px"}else{var l=this.imageTileCache.getImage(u,t,a);j.isOutside=false;if(j.imageKey!==n||j.isPartial){this.browser.removeAllChildren(v);v.appendChild(l);j.image=l;j.imageKey=n;j.isPartial=l.isPartial}j.image.style.width=m+"px";j.image.style.height=m+"px"}}i+=o}g+=o}},setMaxTiles:function(b,a){this.imageTileCache.setMaxTiles(b,a)}};bigshot.Object.validate("bigshot.TileLayer",bigshot.Layer);bigshot.LRUMap=function(){this.keyToTime={};this.counter=0;this.size=0};bigshot.LRUMap.prototype={access:function(a){this.remove(a);this.keyToTime[a]=this.counter;++this.counter;++this.size},remove:function(a){if(this.keyToTime[a]){delete this.keyToTime[a];--this.size;return true}else{return false}},getSize:function(){return this.size},leastUsed:function(){var b=this.counter+1;var c=null;for(var a in this.keyToTime){if(this.keyToTime[a]<b){b=this.keyToTime[a];c=a}}return c}};bigshot.ImageTileCache=function(d,a,c){var b=this;this.parameters=c;this.fullImage=null;c.dataLoader.loadImage(c.fileSystem.getPosterFilename(),function(e){b.fullImage=e;if(a){a()}});this.maxCacheSize=512;this.maxTileX=0;this.maxTileY=0;this.cachedImages={};this.requestedImages={};this.usedImages={};this.lastOnLoadFiredAt=0;this.imageRequests=0;this.lruMap=new bigshot.LRUMap();this.onLoaded=d;this.browser=new bigshot.Browser();this.partialImageSize=c.tileSize/4;this.POSTER_ZOOM_LEVEL=Math.log(c.posterSize/Math.max(c.width,c.height))/Math.log(2)};bigshot.ImageTileCache.prototype={resetUsed:function(){this.usedImages={}},setMaxTiles:function(b,a){this.maxTileX=b;this.maxTileY=a},getPartialImage:function(c,b,d){var a=this.getPartialImageFromDownsampled(c,b,d,0,0,this.parameters.tileSize,this.parameters.tileSize);if(a==null){a=this.getPartialImageFromPoster(c,b,d)}return a},getPartialImageFromPoster:function(d,c,e){if(this.fullImage&&this.fullImage.complete){var a=this.fullImage.width/this.parameters.width;var b=a*this.parameters.tileSize/Math.pow(2,e);x0=Math.floor(b*d);y0=Math.floor(b*c);w=Math.floor(b);h=Math.floor(b);return this.createPartialImage(this.fullImage,this.fullImage.width,x0,y0,w,h)}else{return null}},createPartialImage:function(f,k,b,p,q,g){var c=document.createElement("canvas");if(!c.width){return null}c.width=this.partialImageSize;c.height=this.partialImageSize;var r=c.getContext("2d");var d=f.width/k;var o=Math.floor(b*d);var n=Math.floor(p*d);var a=this.partialImageSize;var l=this.partialImageSize;q*=d;if(o+q>=f.width){var i=q;q=f.width-o;a*=q/i}g*=d;if(n+g>=f.height){var m=g;g=f.height-n;l*=g/m}try{r.drawImage(f,o,n,q,g,-0.1,-0.1,a+0.2,l+0.2)}catch(j){return null}return c},getPartialImageFromDownsampled:function(a,j,d,b,f,g,e){if(d<this.POSTER_ZOOM_LEVEL||d<this.parameters.minZoom){return null}var i=this.getImageKey(a,j,d);var c=this.cachedImages[i];if(c==null){this.requestImage(a,j,d)}if(c){return this.createPartialImage(c,this.parameters.tileSize,b,f,g,e)}else{g/=2;e/=2;b/=2;f/=2;if((a%2)==1){b+=this.parameters.tileSize/2}if((j%2)==1){f+=this.parameters.tileSize/2}a=Math.floor(a/2);j=Math.floor(j/2);--d;return this.getPartialImageFromDownsampled(a,j,d,b,f,g,e)}},getEmptyImage:function(){var a=document.createElement("img");if(this.parameters.emptyImage){a.src=this.parameters.emptyImage}else{a.src="data:image/gif,GIF89a%01%00%01%00%80%00%00%00%00%00%FF%FF%FF!%F9%04%00%00%00%00%00%2C%00%00%00%00%01%00%01%00%00%02%02D%01%00%3B"}return a},getImage:function(e,d,f){if(e<0||d<0||e>=this.maxTileX||d>=this.maxTileY){return this.getEmptyImage()}var b=this.getImageKey(e,d,f);this.lruMap.access(b);if(this.cachedImages[b]){if(this.usedImages[b]){var c=this.parameters.dataLoader.loadImage(this.getImageFilename(e,d,f));c.isPartial=false;return c}else{this.usedImages[b]=true;var a=this.cachedImages[b];return a}}else{this.requestImage(e,d,f);var a=this.getPartialImage(e,d,f);if(a!=null){a.isPartial=true;this.cachedImages[b]=a}else{a=this.getEmptyImage();if(a!=null){a.isPartial=true}}return a}},requestImage:function(d,c,e){var a=this.getImageKey(d,c,e);if(!this.requestedImages[a]){this.imageRequests++;var b=this;this.requestedImages[a]=true;this.parameters.dataLoader.loadImage(this.getImageFilename(d,c,e),function(f){delete b.requestedImages[a];b.imageRequests--;f.isPartial=false;b.cachedImages[a]=f;b.fireOnLoad()})}},fireOnLoad:function(){var a=new Date();if(this.imageRequests==0||a.getTime()>(this.lastOnLoadFiredAt+50)){this.purgeCache();this.lastOnLoadFiredAt=a.getTime();this.onLoaded()}},purgeCache:function(){for(var a=0;a<4;++a){if(this.lruMap.getSize()>this.maxCacheSize){var b=this.lruMap.leastUsed();this.lruMap.remove(b);delete this.cachedImages[b]}}},getImageKey:function(b,a,c){return"I"+b+"_"+a+"_"+c},getImageFilename:function(c,a,d){var b=this.parameters.fileSystem.getImageFilename(c,a,d);return b}};bigshot.ImageParameters=function(b){this.posterSize=0;this.emptyImage=null;this.suffix=null;this.width=0;this.height=0;this.container=null;this.minZoom=0;this.maxZoom=0;this.tileSize=0;this.overlap=0;this.wrapX=false;this.wrapY=false;this.basePath=null;this.fileSystemType="folder";this.fileSystem=null;this.dataLoader=new bigshot.DefaultDataLoader();this.touchUI=false;this.fling=true;this.maxTextureMagnification=1;if(b){for(var a in b){this[a]=b[a]}}this.merge=function(d,e){for(var c in d){if(e||!this[c]){this[c]=d[c]}}};return this};bigshot.ImageBase=function(b){bigshot.EventDispatcher.call(this);this.parameters=b;this.flying=0;this.container=b.container;this.x=b.width/2;this.y=b.height/2;this.zoom=0;this.width=b.width;this.height=b.height;this.minZoom=b.minZoom;this.maxZoom=b.maxZoom;this.tileSize=b.tileSize;this.overlap=0;this.imageTileCache=null;this.dragStart=null;this.dragged=false;this.layers=new Array();this.fullScreenHandler=null;this.currentGesture=null;var a=this;this.onresizeHandler=function(f){a.onresize()};var d=function(e){if(e.preventDefault){e.preventDefault()}return false};var c=function(e){if(e.clientX){return e}else{return{clientX:e.changedTouches[0].clientX,clientY:e.changedTouches[0].clientY,changedTouches:e.changedTouches}}};this.setupLayers();this.resize();this.allListeners={DOMMouseScroll:function(f){a.mouseWheel(f);return d(f)},mousewheel:function(f){a.mouseWheel(f);return d(f)},dblclick:function(f){a.mouseDoubleClick(f);return d(f)},mousedown:function(f){a.dragMouseDown(f);return d(f)},gesturestart:function(f){a.gestureStart(f);return d(f)},gesturechange:function(f){a.gestureChange(f);return d(f)},gestureend:function(f){a.gestureEnd(f);return d(f)},touchstart:function(f){a.dragMouseDown(c(f));return d(f)},mouseup:function(f){a.dragMouseUp(f);return d(f)},touchend:function(f){a.dragMouseUp(c(f));return d(f)},mousemove:function(f){a.dragMouseMove(f);return d(f)},mouseout:function(f){return d(f)},touchmove:function(f){a.dragMouseMove(c(f));return d(f)}};this.addEventListeners();this.browser.registerListener(window,"resize",a.onresizeHandler,false);this.zoomToFit()};bigshot.ImageBase.prototype={browser:new bigshot.Browser(),addEventListeners:function(){for(var a in this.allListeners){this.browser.registerListener(this.container,a,this.allListeners[a],false)}},removeEventListeners:function(){for(var a in this.allListeners){this.browser.unregisterListener(this.container,a,this.allListeners[a],false)}},setupLayers:function(){},getTextureStretch:function(){var a=Math.log(this.parameters.maxTextureMagnification/this.browser.getDevicePixelScale())/Math.LN2;return a},clampXY:function(j,g){var e=this.container.clientWidth;var d=this.container.clientHeight;var f=Math.pow(2,this.zoom);var b=e/f;var a=d/f;var i=function(m,o,n){var l=m/2;l=Math.min(o/2,l);if(n<l){n=l}var k=o-m/2;k=Math.max(o/2,k);if(n>k){n=k}return n};var c={};if(j!=null){c.x=i(b,this.width,j)}if(g!=null){c.y=i(a,this.height,g)}return c},layout:function(){var o=this.container.clientWidth;var c=this.container.clientHeight;var p=Math.min(this.maxZoom,Math.max(this.zoom-this.getTextureStretch(),this.minZoom));var l=Math.min(0,Math.ceil(p));var e=Math.pow(2,l);var m=this.clampXY(this.x,this.y);if(!this.parameters.wrapY){this.y=m.y}if(!this.parameters.wrapX){this.x=m.x}var u=this.tileSize/e;var j=Math.pow(2,this.zoom-l);var d=this.tileSize*j;var n=this.width/u;var k=this.height/u;var g=this.x/u;var f=this.y/u;var b=g-(o/2)/d;var a=f-(c/2)/d;var s=Math.floor(b);var r=Math.floor(a);var v=Math.round((b-s)*d);var t=Math.round((a-r)*d);for(var q=0;q<this.layers.length;++q){this.layers[q].layout(p,-v-d,-t-d,s-1,r-1,Math.ceil(d),Math.ceil(d),1)}},resize:function(){var c=Math.ceil(2*this.container.clientWidth/this.tileSize)+2;var a=Math.ceil(2*this.container.clientHeight/this.tileSize)+2;for(var b=0;b<this.layers.length;++b){this.layers[b].resize(c,a)}},createLayerContainer:function(){var a=document.createElement("div");a.style.position="absolute";a.style.overflow="hidden";return a},getContainer:function(){return this.container},addLayer:function(a){this.container.appendChild(a.getContainer());this.layers.push(a)},clampZoom:function(a){return Math.min(this.maxZoom,Math.max(a,this.minZoom))},setZoom:function(c,e){this.zoom=this.clampZoom(c);var g=Math.ceil(this.zoom-this.getTextureStretch());var b=Math.pow(2,g);var f=Math.ceil(b*this.width/this.tileSize);var d=Math.ceil(b*this.height/this.tileSize);for(var a=0;a<this.layers.length;++a){this.layers[a].setMaxTiles(f,d)}if(e){this.layout()}},setMaxZoom:function(a){this.maxZoom=a},getMaxZoom:function(){return this.maxZoom},setMinZoom:function(a){this.minZoom=a},getMinZoom:function(){return this.minZoom},adjustCoordinateForZoom:function(e,a,d,c){var b=Math.pow(2,d)/Math.pow(2,c);return a+(e-a)*b},gestureStart:function(a){this.currentGesture={startZoom:this.zoom,scale:a.scale}},gestureEnd:function(a){this.currentGesture=null;if(this.dragStart){this.dragStart.hadGesture=true}},gestureChange:function(d){if(this.currentGesture){if(this.dragStart){this.dragStart.hadGesture=true}var c=this.clampZoom(this.currentGesture.startZoom+Math.log(d.scale)/Math.log(2));var e=this.getZoom();if(this.currentGesture.clientX!==undefined&&this.currentGesture.clientY!==undefined){var b=this.clientToImage(this.currentGesture.clientX,this.currentGesture.clientY);var a=this.adjustCoordinateForZoom(this.x,b.x,e,c);var f=this.adjustCoordinateForZoom(this.y,b.y,e,c);this.moveTo(a,f,c)}else{this.setZoom(c);this.layout()}}},dragMouseDown:function(a){this.dragStart={x:a.clientX,y:a.clientY};this.dragLast={clientX:a.clientX,clientY:a.clientY,dx:0,dy:0,dt:1000000,time:new Date().getTime()};this.dragged=false},dragMouseMove:function(a){if(this.currentGesture!=null&&a.changedTouches!=null&&a.changedTouches.length>0){var e=0;var d=0;for(var j=0;j<a.changedTouches.length;++j){e+=a.changedTouches[j].clientX;d+=a.changedTouches[j].clientY}this.currentGesture.clientX=e/a.changedTouches.length;this.currentGesture.clientY=d/a.changedTouches.length}if(this.currentGesture==null&&this.dragStart!=null){var k={x:a.clientX-this.dragStart.x,y:a.clientY-this.dragStart.y};if(k.x!=0||k.y!=0){this.dragged=true}var c=Math.pow(2,this.zoom);var g=k.x/c;var f=k.y/c;this.dragStart={x:a.clientX,y:a.clientY};var b=new Date().getTime()-this.dragLast.time;if(b>20){this.dragLast={dx:this.dragLast.clientX-a.clientX,dy:this.dragLast.clientY-a.clientY,dt:b,clientX:a.clientX,clientY:a.clientY,time:new Date().getTime()}}this.moveTo(this.x-g,this.y-f)}},dragMouseUp:function(a){if(this.currentGesture==null&&!this.dragStart.hadGesture&&this.dragStart!=null){this.dragStart=null;if(!this.dragged){this.mouseClick(a)}else{var e=Math.pow(2,this.zoom);var j=this.dragLast.dx/e;var i=this.dragLast.dy/e;var d=Math.sqrt(j*j+i*i);var c=this.dragLast.dt;var b=new Date().getTime()-this.dragLast.time;this.dragLast=null;var g=c>0?(d/c):0;if(g>0.05&&b<250&&c>20&&this.parameters.fling){var f=new Date().getTime();j/=c;i/=c;this.flyTo(this.x+j*250,this.y+i*250,this.zoom)}}}},mouseDoubleClick:function(b){var a=this.createImageEventData({type:"dblclick",clientX:b.clientX,clientY:b.clientY});this.fireEvent("dblclick",a);if(!a.defaultPrevented){this.flyTo(a.imageX,a.imageY,this.zoom+0.5)}},getZoom:function(){return this.zoom},moveTo:function(a,d,b,c){this.stopFlying();if(a!=null||d!=null){this.setPosition(a,d,false)}if(b!=null){this.setZoom(b,false)}if(c==undefined||c==true){this.layout()}},setPosition:function(a,d,c){var b=this.clampXY(a,d);if(a!=null){if(this.parameters.wrapX){if(a<0||a>=this.width){a=(a+this.width)%this.width}}else{a=b.x}this.x=Math.max(0,Math.min(this.width,a))}if(d!=null){if(this.parameters.wrapY){if(d<0||d>=this.height){d=(d+this.height)%this.height}}else{d=b.y}this.y=Math.max(0,Math.min(this.height,d))}if(c!=false){this.layout()}},fitZoom:function(c,a){var b=a/c;return Math.log(b)/Math.LN2},getZoomToFitValue:function(){return Math.min(this.fitZoom(this.parameters.width,this.container.clientWidth),this.fitZoom(this.parameters.height,this.container.clientHeight))},getZoomToFillValue:function(){return Math.max(this.fitZoom(this.parameters.width,this.container.clientWidth),this.fitZoom(this.parameters.height,this.container.clientHeight))},zoomToFit:function(){this.moveTo(null,null,this.getZoomToFitValue())},zoomToFill:function(){this.moveTo(null,null,this.getZoomToFillValue())},zoomToFitHeight:function(){this.moveTo(null,null,this.fitZoom(this.parameters.height,this.container.clientHeight))},zoomToFitWidth:function(){this.moveTo(null,null,this.fitZoom(this.parameters.width,this.container.clientWidth))},flyZoomToFitHeight:function(){this.flyTo(null,this.parameters.height/2,this.fitZoom(this.parameters.height,this.container.clientHeight))},flyZoomToFitWidth:function(){this.flyTo(this.parameters.width/2,null,this.fitZoom(this.parameters.width,this.container.clientWidth))},flyZoomToFit:function(){this.flyTo(this.parameters.width/2,this.parameters.height/2,this.getZoomToFitValue())},clientToImage:function(c,a){var b=Math.pow(2,this.zoom);return{x:(c-this.container.clientWidth/2)/b+this.x,y:(a-this.container.clientHeight/2)/b+this.y}},mouseWheelHandler:function(g,d){var e=false;if(g>0){e=0.5}else{if(g<0){e=-0.5}}if(e){var b=this.clientToImage(d.clientX,d.clientY);var c=Math.min(this.maxZoom,Math.max(this.getZoom()+e,this.minZoom));var a=this.adjustCoordinateForZoom(this.x,b.x,this.getZoom(),c);var f=this.adjustCoordinateForZoom(this.y,b.y,this.getZoom(),c);this.flyTo(a,f,c,true)}},mouseWheel:function(a){var b=0;if(!a){a=window.event}if(a.wheelDelta){b=a.wheelDelta/120;if(window.opera){b=-b}}else{if(a.detail){b=-a.detail}}if(b){this.mouseWheelHandler(b,a)}if(a.preventDefault){a.preventDefault()}a.returnValue=false},onresize:function(){this.resize();this.layout()},getX:function(){return this.x},getY:function(){return this.y},stopFlying:function(){this.flying++},flyTo:function(m,l,q,e){var g=this;m=m!=null?m:this.x;l=l!=null?l:this.y;q=q!=null?q:this.zoom;e=e!=null?e:false;var d=this.x;var c=this.y;var o=this.zoom;var n=this.clampXY(m,l);var k=this.parameters.wrapX?m:n.x;var i=this.parameters.wrapY?l:n.y;var b=Math.min(this.maxZoom,Math.max(q,this.minZoom));this.flying++;var a=this.flying;var f=new Date().getTime();var p=function(z,x,t,s,r){var y=(x-z);var v=-y*Math.pow(2,-t*s);var u=t*r;if(y<0){v=Math.max(0,v-u)}else{v=Math.min(0,v+u)}return x+v};var j=function(){if(g.flying==a){var u=(new Date().getTime()-f)/1000;var r=p(d,k,u,e?10:4,e?0.2:1);var x=p(c,i,u,e?10:4,e?0.2:1);var v=p(o,b,u,10,0.2);var s=true;var t=Math.min(Math.pow(2,g.getZoom()),1);if(Math.abs(r-k)<(0.5*t)){r=k}else{s=false}if(Math.abs(x-i)<(0.5*t)){x=i}else{s=false}if(Math.abs(v-b)<0.02){v=b}else{s=false}g.setPosition(r,x,false);g.setZoom(v,false);g.layout();if(!s){g.browser.requestAnimationFrame(j,g.container)}}};this.browser.requestAnimationFrame(j,this.container)},rectVisibleAtZoomLevel:function(a,b){return Math.min(this.fitZoom(a,this.container.clientWidth),this.fitZoom(b,this.container.clientHeight))},getTouchAreaBaseSize:function(){var a=((this.container.clientWidth+this.container.clientHeight)/2)*0.2;return Math.min(a,Math.min(this.container.clientWidth,this.container.clientHeight)/6)},createImageEventData:function(b){var a=this.browser.getElementPosition(this.container);b.localX=b.clientX-a.x;b.localY=b.clientY-a.y;var c=Math.pow(2,this.zoom);b.imageX=(b.localX-this.container.clientWidth/2)/c+this.x;b.imageY=(b.localY-this.container.clientHeight/2)/c+this.y;b.target=this;b.currentTarget=this;return new bigshot.ImageEvent(b)},mouseClick:function(b){var a=this.createImageEventData({type:"click",clientX:b.clientX,clientY:b.clientY});this.fireEvent("click",a)},showTouchUI:function(f,g){if(!f){f=2500}if(!g){g=1000}var a=this.getTouchAreaBaseSize();var m=this.getTouchAreaBaseSize();var e=this.container.clientWidth/2;var d=this.container.clientHeight/2;var n=document.createElement("div");n.style.position="absolute";n.style.zIndex="9999";n.style.opacity=0.9;n.style.width=this.container.clientWidth+"px";n.style.height=this.container.clientHeight+"px";var b=document.createElement("div");b.style.position="absolute";var l=document.createElement("div");l.style.position="relative";l.style.background="black";l.style.textAlign="center";l.style.top=(d-m)+"px";l.style.left=(e-m)+"px";l.style.width=(2*m)+"px";l.style.height=(2*m)+"px";n.appendChild(b);b.appendChild(l);l.innerHTML="<span style='display:inline-box; position:relative; vertical-align:middle; font-size: 20pt; top: 10pt; color:white'>ZOOM IN</span>";var c=document.createElement("div");c.style.position="absolute";var k=document.createElement("div");k.style.position="relative";k.style.border=a+"px solid black";k.style.top="0px";k.style.left="0px";k.style.textAlign="center";k.style.width=this.container.clientWidth+"px";k.style.height=this.container.clientHeight+"px";k.style.MozBoxSizing=k.style.boxSizing=k.style.WebkitBoxSizing="border-box";k.innerHTML="<span style='position:relative; font-size: 20pt; top: -25pt; color:white'>ZOOM OUT</span>";c.appendChild(k);n.appendChild(c);this.container.appendChild(n);var j=this;var i=0.9;var p=g/50;if(p<1){p=1}var o=function(){i=i-(0.9/p);if(i<0){j.container.removeChild(n)}else{n.style.opacity=i;setTimeout(o,50)}};setTimeout(o,f)},exitFullScreen:function(){if(this.fullScreenHandler){this.removeEventListeners();this.fullScreenHandler.close();this.addEventListeners();this.fullScreenHandler=null;return}},fullScreen:function(a){if(this.fullScreenHandler){return}var c=document.createElement("div");c.style.position="absolute";c.style.fontSize="16pt";c.style.top="128px";c.style.width="100%";c.style.color="white";c.style.padding="16px";c.style.zIndex="9999";c.style.textAlign="center";c.style.opacity="0.75";c.innerHTML="<span style='border-radius: 16px; -moz-border-radius: 16px; padding: 16px; padding-left: 32px; padding-right: 32px; background:black'>Press Esc to exit full screen mode.</span>";var b=this;this.fullScreenHandler=new bigshot.FullScreen(this.container);this.fullScreenHandler.restoreSize=true;this.fullScreenHandler.addOnResize(function(){if(b.fullScreenHandler&&b.fullScreenHandler.isFullScreen){b.container.style.width=window.innerWidth+"px";b.container.style.height=window.innerHeight+"px"}b.onresize()});this.fullScreenHandler.addOnClose(function(){if(c.parentNode){try{div.removeChild(c)}catch(d){}}b.fullScreenHandler=null});if(a){this.fullScreenHandler.addOnClose(function(){a()})}this.removeEventListeners();this.fullScreenHandler.open();this.addEventListeners();if(this.fullScreenHandler.getRootElement()){this.fullScreenHandler.getRootElement().appendChild(c);setTimeout(function(){var e=0.75;var d=function(){e-=0.02;if(c.parentNode){if(e<=0){try{div.removeChild(c)}catch(f){}}else{c.style.opacity=e;setTimeout(d,20)}}};setTimeout(d,20)},3500)}return function(){b.fullScreenHandler.close()}},dispose:function(){this.browser.unregisterListener(window,"resize",this.onresizeHandler,false);this.removeEventListeners()}};bigshot.Object.extend(bigshot.ImageBase,bigshot.EventDispatcher);bigshot.Image=function(a){bigshot.setupFileSystem(a);a.merge(a.fileSystem.getDescriptor(),false);bigshot.ImageBase.call(this,a)};bigshot.Image.prototype={setupLayers:function(){var a=this;this.thisTileCache=new bigshot.ImageTileCache(function(){a.layout()},null,this.parameters);this.addLayer(new bigshot.TileLayer(this,this.parameters,0,0,this.thisTileCache))}};bigshot.Object.extend(bigshot.Image,bigshot.ImageBase);bigshot.HTMLElementLayer=function(d,b,c,a){this.hotspots=new Array();this.browser=new bigshot.Browser();this.image=d;this.container=d.createLayerContainer();this.parentContainer=d.getContainer();this.element=b;this.parentContainer.appendChild(b);this.w=c;this.h=a;this.resize(0,0)};bigshot.HTMLElementLayer.prototype={getContainer:function(){return this.container},resize:function(a,b){this.container.style.width=this.parentContainer.clientWidth+"px";this.container.style.height=this.parentContainer.clientHeight+"px"},layout:function(i,d,g,e,a,j,b,f){var c=Math.pow(2,this.image.getZoom());d-=b*e;g-=b*a;this.element.style.top=g+"px";this.element.style.left=d+"px";this.element.style.width=(this.w*c)+"px";this.element.style.height=(this.h*c)+"px"},setMaxTiles:function(b,a){}};bigshot.Object.validate("bigshot.HTMLElementLayer",bigshot.Layer);bigshot.HTMLDivElementLayer=function(e,b,c,a,f,d){this.wrapX=f;this.wrapY=d;this.hotspots=new Array();this.browser=new bigshot.Browser();this.image=e;this.container=e.createLayerContainer();this.parentContainer=e.getContainer();this.element=b;this.parentContainer.appendChild(b);this.w=c;this.h=a;this.resize(0,0)};bigshot.HTMLDivElementLayer.prototype={getContainer:function(){return this.container},resize:function(a,b){this.container.style.width=this.parentContainer.clientWidth+"px";this.container.style.height=this.parentContainer.clientHeight+"px"},layout:function(m,e,l,f,a,n,b,j){var d=Math.pow(2,this.image.getZoom());e-=b*f;l-=b*a;var c=(this.w*d);var k=(this.h*d);this.element.style.backgroundSize=c+"px "+k+"px";var i="0px";var g="0px";if(this.wrapY){this.element.style.top="0px";this.element.style.height=(this.parentContainer.clientHeight)+"px";g=l+"px"}else{this.element.style.top=l+"px";this.element.style.height=k+"px"}if(this.wrapX){this.element.style.left="0px";this.element.style.width=(this.parentContainer.clientWidth)+"px";i=e+"px"}else{this.element.style.left=e+"px";this.element.style.width=c+"px"}this.element.style.backgroundPosition=i+" "+g},setMaxTiles:function(b,a){}};bigshot.Object.validate("bigshot.HTMLDivElementLayer",bigshot.Layer);bigshot.SimpleImage=function(a,b){a.merge({fileSystem:null,fileSystemType:"simple",maxTextureMagnification:1,tileSize:1024},true);if(b){a.merge({width:b.width,height:b.height});this.imgElement=b}else{if(a.width==0||a.height==0){throw new Error("No imgElement and missing width or height in ImageParameters")}}bigshot.setupFileSystem(a);bigshot.ImageBase.call(this,a)};bigshot.SimpleImage.prototype={setupLayers:function(){if(!this.imgElement){this.imgElement=document.createElement("div");this.imgElement.style.backgroundImage="url('"+this.parameters.basePath+"')";this.imgElement.style.position="absolute";if(!this.parameters.wrapX&&!this.parameters.wrapY){this.imgElement.style.backgroundRepeat="no-repeat"}else{if(this.parameters.wrapX&&!this.parameters.wrapY){this.imgElement.style.backgroundRepeat="repeat-x"}else{if(!this.parameters.wrapX&&this.parameters.wrapY){this.imgElement.style.backgroundRepeat="repeat-y"}else{if(this.parameters.wrapX&&this.parameters.wrapY){this.imgElement.style.backgroundRepeat="repeat"}}}}}this.addLayer(new bigshot.HTMLDivElementLayer(this,this.imgElement,this.parameters.width,this.parameters.height,this.parameters.wrapX,this.parameters.wrapY))}};bigshot.Object.extend(bigshot.SimpleImage,bigshot.ImageBase);bigshot.FileSystem=function(){};bigshot.FileSystem.prototype={getFilename:function(a){},getImageFilename:function(b,a,c){},setPrefix:function(a){},getDescriptor:function(){},getPosterFilename:function(){}};bigshot.setupFileSystem=function(a){if(!a.fileSystem){if(a.fileSystemType=="archive"){a.fileSystem=new bigshot.ArchiveFileSystem(a)}else{if(a.fileSystemType=="dzi"){a.fileSystem=new bigshot.DeepZoomImageFileSystem(a)}else{if(a.fileSystemType=="simple"){a.fileSystem=new bigshot.SimpleFileSystem(a)}else{a.fileSystem=new bigshot.FolderFileSystem(a)}}}}};bigshot.SimpleFileSystem=function(a){this.parameters=a};bigshot.SimpleFileSystem.prototype={getDescriptor:function(){return{}},getPosterFilename:function(){return null},getFilename:function(a){return null},getImageFilename:function(b,a,c){return null},getPrefix:function(){return""},setPrefix:function(a){this.prefix=a}};bigshot.Object.validate("bigshot.SimpleFileSystem",bigshot.FileSystem);bigshot.FolderFileSystem=function(a){this.prefix=null;this.suffix="";this.parameters=a};bigshot.FolderFileSystem.prototype={getDescriptor:function(){this.browser=new bigshot.Browser();var b=this.browser.createXMLHttpRequest();b.open("GET",this.getFilename("descriptor"),false);b.send(null);var c={};if(b.status==200){var d=b.responseText.split(":");for(var a=0;a<d.length;a+=2){if(d[a]=="suffix"){c[d[a]]=d[a+1]}else{c[d[a]]=parseInt(d[a+1])}}this.suffix=c.suffix;return c}else{throw new Error("Unable to find descriptor.")}},getPosterFilename:function(){return this.getFilename("poster"+this.suffix)},setPrefix:function(a){this.prefix=a},getPrefix:function(){if(this.prefix){return this.prefix+"/"}else{return""}},getFilename:function(a){return this.parameters.basePath+"/"+this.getPrefix()+a},getImageFilename:function(c,b,d){var a=(-d)+"/"+c+"_"+b+this.suffix;return this.getFilename(a)}};bigshot.Object.validate("bigshot.FolderFileSystem",bigshot.FileSystem);bigshot.DeepZoomImageFileSystem=function(a){this.prefix="";this.suffix="";this.DZ_NAMESPACE="http://schemas.microsoft.com/deepzoom/2009";this.fullZoomLevel=0;this.posterName="";this.parameters=a};bigshot.DeepZoomImageFileSystem.prototype={getDescriptor:function(){var e={};var b=this.parameters.dataLoader.loadXml(this.parameters.basePath+this.prefix+".xml",false);var d=b.getElementsByTagName("Image")[0];var c=b.getElementsByTagName("Size")[0];e.width=parseInt(c.getAttribute("Width"));e.height=parseInt(c.getAttribute("Height"));e.tileSize=parseInt(d.getAttribute("TileSize"));e.overlap=parseInt(d.getAttribute("Overlap"));e.suffix="."+d.getAttribute("Format");e.posterSize=e.tileSize;this.suffix=e.suffix;this.fullZoomLevel=Math.ceil(Math.log(Math.max(e.width,e.height))/Math.LN2);e.minZoom=-this.fullZoomLevel;var a=Math.ceil(Math.log(e.tileSize)/Math.LN2);this.posterName=this.getImageFilename(0,0,a-this.fullZoomLevel);return e},setPrefix:function(a){this.prefix=a},getPosterFilename:function(){return this.posterName},getFilename:function(a){return this.parameters.basePath+this.prefix+"/"+a},getImageFilename:function(d,c,e){var a=this.fullZoomLevel+e;var b=a+"/"+d+"_"+c+this.suffix;return this.getFilename(b)}};bigshot.ArchiveFileSystem=function(d){this.indexSize=0;this.offset=0;this.index={};this.prefix="";this.suffix="";this.parameters=d;var a=new bigshot.Browser();var c=a.createXMLHttpRequest();c.open("GET",this.parameters.basePath+"&start=0&length=24&type=text/plain",false);c.send(null);if(c.status==200){if(c.responseText.substring(0,7)!="BIGSHOT"){alert('"'+this.parameters.basePath+'" is not a valid bigshot file');return}this.indexSize=parseInt(c.responseText.substring(8),16);this.offset=this.indexSize+24;c.open("GET",this.parameters.basePath+"&type=text/plain&start=24&length="+this.indexSize,false);c.send(null);if(c.status==200){var e=c.responseText.split(":");for(var b=0;b<e.length;b+=3){this.index[e[b]]={start:parseInt(e[b+1])+this.offset,length:parseInt(e[b+2])}}}else{alert('The index of "'+this.parameters.basePath+'" could not be loaded: '+c.status)}}else{alert('The header of "'+this.parameters.basePath+'" could not be loaded: '+c.status)}};bigshot.ArchiveFileSystem.prototype={getDescriptor:function(){this.browser=new bigshot.Browser();var b=this.browser.createXMLHttpRequest();b.open("GET",this.getFilename("descriptor"),false);b.send(null);var c={};if(b.status==200){var d=b.responseText.split(":");for(var a=0;a<d.length;a+=2){if(d[a]=="suffix"){c[d[a]]=d[a+1]}else{c[d[a]]=parseInt(d[a+1])}}this.suffix=c.suffix;return c}else{throw new Error("Unable to find descriptor.")}},getPosterFilename:function(){return this.getFilename("poster"+this.suffix)},getFilename:function(a){a=this.getPrefix()+a;if(!this.index[a]&&console){console.log("Can't find "+a)}var b=this.parameters.basePath+"&start="+this.index[a].start+"&length="+this.index[a].length;if(a.substring(a.length-4)==".jpg"){b=b+"&type=image/jpeg"}else{if(a.substring(a.length-4)==".png"){b=b+"&type=image/png"}else{b=b+"&type=text/plain"}}return b},getImageFilename:function(c,b,d){var a=(-d)+"/"+c+"_"+b+this.suffix;return this.getFilename(a)},getPrefix:function(){if(this.prefix){return this.prefix+"/"}else{return""}},setPrefix:function(a){this.prefix=a}};bigshot.Object.validate("bigshot.ArchiveFileSystem",bigshot.FileSystem);bigshot.VRTileCache=function(){};bigshot.VRTileCache.prototype={getTexture:function(b,a,c){},purge:function(){},dispose:function(){}};bigshot.ImageVRTileCache=function(c,a,b){this.imageTileCache=new bigshot.ImageTileCache(c,a,b);this.imageTileCache.setMaxTiles(999999,999999)};bigshot.ImageVRTileCache.prototype={getTexture:function(c,b,d){var a=this.imageTileCache.getImage(c,b,d);return a},purge:function(){this.imageTileCache.resetUsed()},dispose:function(){}};bigshot.Object.validate("bigshot.ImageVRTileCache",bigshot.VRTileCache);bigshot.TextureTileCache=function(d,a,c,b){this.parameters=c;this.webGl=b;this.fullImage=c.dataLoader.loadImage(c.fileSystem.getPosterFilename(),a);this.maxTextureCacheSize=512;this.maxImageCacheSize=2048;this.cachedTextures={};this.cachedImages={};this.requestedImages={};this.lastOnLoadFiredAt=0;this.imageRequests=0;this.partialImageSize=c.tileSize/8;this.imageLruMap=new bigshot.LRUMap();this.textureLruMap=new bigshot.LRUMap();this.onLoaded=d;this.browser=new bigshot.Browser();this.disposed=false};bigshot.TextureTileCache.prototype={getPartialTexture:function(b,o,e){if(this.fullImage.complete){var c=document.createElement("canvas");if(!c.width){return null}c.width=this.partialImageSize;c.height=this.partialImageSize;var n=c.getContext("2d");var p=this.parameters.posterSize/Math.max(this.parameters.width,this.parameters.height);var l=Math.floor(p*this.parameters.width);var d=Math.floor(p*this.parameters.height);var m=p*(this.parameters.tileSize-this.parameters.overlap)/Math.pow(2,e);var j=Math.floor(m*b);var i=Math.floor(m*o);var k=Math.floor(m);var f=Math.floor(m);var a=this.partialImageSize+2;var g=this.partialImageSize+2;if(j+k>l){k=l-j;a=this.partialImageSize*(k/Math.floor(m))}if(i+f>d){f=d-i;g=this.partialImageSize*(f/Math.floor(m))}n.drawImage(this.fullImage,j,i,k,f,-1,-1,a,g);return this.webGl.createImageTextureFromImage(c,this.parameters.textureMinFilter,this.parameters.textureMagFilter)}else{return null}},setCachedTexture:function(b,a){if(this.cachedTextures[b]!=null){this.webGl.deleteTexture(this.cachedTextures[b])}this.cachedTextures[b]=a},getTexture:function(d,c,e){var b=this.getImageKey(d,c,e);this.textureLruMap.access(b);this.imageLruMap.access(b);if(this.cachedTextures[b]){return this.cachedTextures[b]}else{if(this.cachedImages[b]){this.setCachedTexture(b,this.webGl.createImageTextureFromImage(this.cachedImages[b],this.parameters.textureMinFilter,this.parameters.textureMagFilter));return this.cachedTextures[b]}else{this.requestImage(d,c,e);var a=this.getPartialTexture(d,c,e);if(a){this.setCachedTexture(b,a)}return a}}},requestImage:function(d,c,e){var a=this.getImageKey(d,c,e);if(!this.requestedImages[a]){this.imageRequests++;var b=this;this.parameters.dataLoader.loadImage(this.getImageFilename(d,c,e),function(g){if(b.disposed){return}b.cachedImages[a]=g;b.setCachedTexture(a,b.webGl.createImageTextureFromImage(g,b.parameters.textureMinFilter,b.parameters.textureMagFilter));delete b.requestedImages[a];b.imageRequests--;var f=new Date();if(b.imageRequests==0||f.getTime()>(b.lastOnLoadFiredAt+50)){b.lastOnLoadFiredAt=f.getTime();b.onLoaded()}});this.requestedImages[a]=true}},purge:function(){var a=this;this.purgeCache(this.textureLruMap,this.cachedTextures,this.maxTextureCacheSize,function(b){a.webGl.deleteTexture(a.cachedTextures[b])});this.purgeCache(this.imageLruMap,this.cachedImages,this.maxImageCacheSize,function(b){})},purgeCache:function(b,c,a,e){for(var d=0;d<64;++d){if(b.getSize()>a){var f=b.leastUsed();b.remove(f);if(e){e(f)}delete c[f]}else{break}}},getImageKey:function(b,a,c){return"I"+b+"_"+a+"_"+c},getImageFilename:function(c,a,d){var b=this.parameters.fileSystem.getImageFilename(c,a,d);return b},dispose:function(){this.disposed=true;for(var a in this.cachedTextures){this.webGl.deleteTexture(this.cachedTextures[a])}}};bigshot.Object.validate("bigshot.TextureTileCache",bigshot.VRTileCache);bigshot.VRFace=function(b,j,g,d,m,l,e){var i=this;this.owner=b;this.key=j;this.topLeft=g;this.width=d;this.u=m;this.v=l;this.updated=false;this.parameters=new Object();for(var f in this.owner.getParameters()){this.parameters[f]=this.owner.getParameters()[f]}bigshot.setupFileSystem(this.parameters);this.parameters.fileSystem.setPrefix("face_"+j);this.parameters.merge(this.parameters.fileSystem.getDescriptor(),false);this.tileCache=b.renderer.createTileCache(function(){i.updated=true;b.renderUpdated(bigshot.VRPanorama.ONRENDER_TEXTURE_UPDATE)},e,this.parameters);this.fullSize=this.parameters.width;this.overlap=this.parameters.overlap;this.tileSize=this.parameters.tileSize;this.minDivisions=0;var c=Math.log(this.fullSize-this.overlap)/Math.LN2;var a=Math.log(this.tileSize-this.overlap)/Math.LN2;this.maxDivisions=Math.floor(c-a);this.maxTesselation=this.parameters.maxTesselation>=0?this.parameters.maxTesselation:this.maxDivisions};bigshot.VRFace.prototype={browser:new bigshot.Browser(),dispose:function(){this.tileCache.dispose()},pt3dMultAdd:function(d,b,c){return{x:d.x*b+c.x,y:d.y*b+c.y,z:d.z*b+c.z}},pt3dMult:function(b,a){return{x:b.x*a,y:b.y*a,z:b.z*a}},generateFace:function(g,e,d,b,a,c){d*=this.tileSize/(this.tileSize-this.overlap);var f=this.tileCache.getTexture(b,a,-this.maxDivisions+c);g.addQuad(this.owner.renderer.createTexturedQuad(e,this.pt3dMult(this.u,d),this.pt3dMult(this.v,d),f))},VISIBLE_NONE:0,VISIBLE_SOME:1,VISIBLE_ALL:2,pointInRect:function(b,c,a){return(b.x>=c.x&&b.y>=c.y&&b.x<a.x&&b.y<a.y)},intersectWithView:function intersectWithView(x){var d=0;var c=[];var m=x.length;for(var r=0;r<m;++r){if(x[r]==null){d++}else{c.push(x[r])}}if(d==4){return this.VISIBLE_NONE}var v=c[0].x;var t=c[0].y;var u=v;var s=t;var l=0;var j=0;var k=this.viewportWidth;var g=this.viewportHeight;var a=0;var b=c.length;for(var r=1;r<b;++r){var f=c[r].x;var e=c[r].y;v=v<f?v:f;t=t<e?t:e;u=u>f?u:f;s=s>e?s:e}var q=v>l?v:l;var p=t>j?t:j;var o=u<k?u:k;var n=s<g?s:g;if(q<=o&&p<=n){return this.VISIBLE_SOME}return this.VISIBLE_NONE},screenDistance:function screenDistance(b,a){if(b==null||a==null){return 0}return Math.max(Math.abs(b.x-a.x),Math.abs(b.y-a.y))},transformToScreen:function transformToScreen(a){return this.owner.renderer.transformToScreen(a)},generateSubdivisionFace:function generateSubdivisionFace(p,m,l,b,u,s,y){if(!y){y=new Array(4);y[0]=this.transformToScreen(m);var k=this.pt3dMultAdd(this.u,l,m);y[1]=this.transformToScreen(k);var n=this.pt3dMultAdd(this.v,l,m);y[3]=this.transformToScreen(n);var e=this.pt3dMultAdd(this.v,l,k);y[2]=this.transformToScreen(e)}var x=this.intersectWithView(y);if(x==this.VISIBLE_NONE){return}var j=0;for(var o=0;o<y.length;++o){var g=(o+1)%4;j=Math.max(this.screenDistance(y[o],y[g]),j)}j*=this.owner.browser.getDevicePixelScale();if(b<this.minDivisions||((j>this.owner.maxTextureMagnification*(this.tileSize-this.overlap))&&b<this.maxDivisions&&b<this.maxTesselation)){var t=this.pt3dMultAdd({x:this.u.x+this.v.x,y:this.u.y+this.v.y,z:this.u.z+this.v.z},l/2,m);var r=this.pt3dMultAdd(this.u,l/2,m);var f=this.pt3dMultAdd(this.v,l/2,m);var q=this.transformToScreen(t);var v=this.transformToScreen(f);var d=this.transformToScreen(r);var c=this.transformToScreen(this.pt3dMultAdd(this.u,l,f));var a=this.transformToScreen(this.pt3dMultAdd(this.v,l,r));this.generateSubdivisionFace(p,m,l/2,b+1,u*2,s*2,[y[0],d,q,v]);this.generateSubdivisionFace(p,r,l/2,b+1,u*2+1,s*2,[d,y[1],c,q]);this.generateSubdivisionFace(p,f,l/2,b+1,u*2,s*2+1,[v,q,a,y[3]]);this.generateSubdivisionFace(p,t,l/2,b+1,u*2+1,s*2+1,[q,c,y[2],a])}else{this.generateFace(p,m,l,u,s,b)}},isUpdated:function(){return this.updated},render:function(a){this.updated=false;this.viewportWidth=this.owner.renderer.getViewportWidth();this.viewportHeight=this.owner.renderer.getViewportHeight();this.generateSubdivisionFace(a,this.topLeft,this.width,0,0,0)},endRender:function(){this.tileCache.purge()}};bigshot.WebGLUtil={debug:false,contextNames:["webgl","experimental-webgl"],createContext0:function(a,b){var c=this.debug?WebGLDebugUtils.makeDebugContext(a.getContext(b)):a.getContext(b);return c},createContext:function(a){for(var b=0;b<this.contextNames.length;++b){try{var d=this.createContext0(a,this.contextNames[b]);if(d){return d}}catch(c){}}throw new Error("Could not initialize WebGL.")},isWebGLSupported:function(){var a=document.createElement("canvas");if(!a.width){return false}try{this.createContext(a);return true}catch(b){return false}}};bigshot.TransformStack=function(){this.mvMatrix=null;this.mvMatrixStack=[];this.reset()};bigshot.TransformStack.prototype={push:function(a){if(a){this.mvMatrixStack.push(a.dup());this.mvMatrix=a.dup();return mvMatrix}else{this.mvMatrixStack.push(this.mvMatrix.dup());return mvMatrix}},pop:function(){if(this.mvMatrixStack.length==0){throw new Error("Invalid popMatrix!")}this.mvMatrix=this.mvMatrixStack.pop();return mvMatrix},reset:function(){this.mvMatrix=Matrix.I(4)},multiply:function(a){this.mvMatrix=a.x(this.mvMatrix)},translate:function(b){var a=Matrix.Translation($V([b.x,b.y,b.z])).ensure4x4();this.multiply(a)},rotate:function(c,b){var d=c*Math.PI/180;var a=Matrix.Rotation(d,$V([b.x,b.y,b.z])).ensure4x4();this.multiply(a)},rotateX:function(a){this.rotate(a,{x:1,y:0,z:0})},rotateY:function(a){this.rotate(a,{x:0,y:1,z:0})},rotateZ:function(a){this.rotate(a,{x:0,y:0,z:1})},perspective:function(d,c,b,e){var a=makePerspective(d,c,b,e);this.multiply(a)},matrix:function(){return this.mvMatrix}};bigshot.WebGL=function(a){this.canvas=a;this.gl=bigshot.WebGLUtil.createContext(this.canvas);this.mvMatrix=new bigshot.TransformStack();this.pMatrix=new bigshot.TransformStack();this.shaderProgram=null;this.onresize()};bigshot.WebGL.prototype={onresize:function(){this.gl.viewportWidth=this.canvas.width;this.gl.viewportHeight=this.canvas.height},fragmentShader:"#ifdef GL_ES\n    precision highp float;\n#endif\n\nvarying vec2 vTextureCoord;\n\nuniform sampler2D uSampler;\n\nvoid main(void) {\n    gl_FragColor = texture2D(uSampler, vec2(vTextureCoord.s, vTextureCoord.t));\n}\n",vertexShader:"attribute vec3 aVertexPosition;\nattribute vec2 aTextureCoord;\n\nuniform mat4 uMVMatrix;\nuniform mat4 uPMatrix;\n\nvarying vec2 vTextureCoord;\n\nvoid main(void) {\n    gl_Position = uPMatrix * uMVMatrix * vec4(aVertexPosition, 1.0);\n    vTextureCoord = aTextureCoord;\n}",createShader:function(c,a){var b=this.gl.createShader(a);this.gl.shaderSource(b,c);this.gl.compileShader(b);if(!this.gl.getShaderParameter(b,this.gl.COMPILE_STATUS)){alert(this.gl.getShaderInfoLog(b));return null}return b},createFragmentShader:function(a){return this.createShader(a,this.gl.FRAGMENT_SHADER)},createVertexShader:function(a){return this.createShader(a,this.gl.VERTEX_SHADER)},initShaders:function(){this.shaderProgram=this.gl.createProgram();this.gl.attachShader(this.shaderProgram,this.createVertexShader(this.vertexShader));this.gl.attachShader(this.shaderProgram,this.createFragmentShader(this.fragmentShader));this.gl.linkProgram(this.shaderProgram);if(!this.gl.getProgramParameter(this.shaderProgram,this.gl.LINK_STATUS)){throw new Error("Could not initialise shaders");return}this.gl.useProgram(this.shaderProgram);this.shaderProgram.vertexPositionAttribute=this.gl.getAttribLocation(this.shaderProgram,"aVertexPosition");this.gl.enableVertexAttribArray(this.shaderProgram.vertexPositionAttribute);this.shaderProgram.textureCoordAttribute=this.gl.getAttribLocation(this.shaderProgram,"aTextureCoord");this.gl.enableVertexAttribArray(this.shaderProgram.textureCoordAttribute);this.shaderProgram.pMatrixUniform=this.gl.getUniformLocation(this.shaderProgram,"uPMatrix");this.shaderProgram.mvMatrixUniform=this.gl.getUniformLocation(this.shaderProgram,"uMVMatrix");this.shaderProgram.samplerUniform=this.gl.getUniformLocation(this.shaderProgram,"uSampler")},setMatrixUniforms:function(){this.gl.uniformMatrix4fv(this.shaderProgram.pMatrixUniform,false,new Float32Array(this.pMatrix.matrix().flatten()));this.gl.uniformMatrix4fv(this.shaderProgram.mvMatrixUniform,false,new Float32Array(this.mvMatrix.matrix().flatten()))},createImageTextureFromImage:function(d,a,c){var b=this.gl.createTexture();this.handleImageTextureLoaded(this,b,d,a,c);return b},createImageTextureFromSource:function(e,a,d){var f=new Image();var c=this.gl.createTexture();var b=this;f.onload=function(){b.handleImageTextureLoaded(b,c,f,a,d)};f.src=e;return c},handleImageTextureLoaded:function(c,b,e,a,d){c.gl.bindTexture(c.gl.TEXTURE_2D,b);c.gl.texImage2D(c.gl.TEXTURE_2D,0,c.gl.RGBA,c.gl.RGBA,c.gl.UNSIGNED_BYTE,e);c.gl.texParameteri(c.gl.TEXTURE_2D,c.gl.TEXTURE_MAG_FILTER,d?d:c.gl.NEAREST);c.gl.texParameteri(c.gl.TEXTURE_2D,c.gl.TEXTURE_MIN_FILTER,a?a:c.gl.NEAREST);c.gl.texParameteri(c.gl.TEXTURE_2D,c.gl.TEXTURE_WRAP_S,c.gl.CLAMP_TO_EDGE);c.gl.texParameteri(c.gl.TEXTURE_2D,c.gl.TEXTURE_WRAP_T,c.gl.CLAMP_TO_EDGE);if(a==c.gl.NEAREST_MIPMAP_NEAREST||a==c.gl.LINEAR_MIPMAP_NEAREST||a==c.gl.NEAREST_MIPMAP_LINEAR||a==c.gl.LINEAR_MIPMAP_LINEAR){c.gl.generateMipmap(c.gl.TEXTURE_2D)}c.gl.bindTexture(c.gl.TEXTURE_2D,null)},deleteTexture:function(a){this.gl.deleteTexture(a)},dispose:function(){delete this.canvas;delete this.gl}};bigshot.VRRenderer=function(){};bigshot.VRRenderer.prototype={createTileCache:function(c,a,b){},createTexturedQuadScene:function(){},createTexturedQuad:function(d,b,a,c){},getViewportWidth:function(){},getViewportHeight:function(){},transformToWorld:function(a){},transformWorldToScreen:function(a){},transformToScreen:function(a){},dispose:function(){},beginRender:function(b,a,d,c){},endRender:function(){},onresize:function(){},resize:function(a,b){},getElement:function(){}};bigshot.AbstractVRRenderer=function(){};bigshot.AbstractVRRenderer.prototype={transformToWorld:function transformToWorld(a){var b=this.mvMatrix.matrix().xPoint3Dhom1(a);return b},transformWorldToScreen:function transformWorldToScreen(d){if(d.z>0){return null}var a=this.pMatrix.matrix().xPoint3Dhom(d);if(Math.abs(a.w)<Sylvester.precision){return null}var i=a.x;var f=a.y;var e=a.z;var c=this.getViewportWidth();var g=this.getViewportHeight();var b={x:(c/2)*i/e+c/2,y:-(g/2)*f/e+g/2};return b},transformToScreen:function transformToScreen(a){var d=this.mvpMatrix.xPoint3Dhom(a);if(d.z<0){return null}var e=d.w;if(Math.abs(d.w)<Sylvester.precision){return null}var i=d.x;var f=d.y;var c=this.getViewportWidth();var g=this.getViewportHeight();var b={x:(c/2)*i/e+c/2,y:-(g/2)*f/e+g/2};return b}};bigshot.CSS3DVRRenderer=function(a){this.container=a;this.canvasOrigin=document.createElement("div");this.canvasOrigin.style.WebkitTransformOrigin="0px 0px 0px";this.canvasOrigin.style.WebkitTransformStyle="preserve-3d";this.canvasOrigin.style.WebkitPerspective="600px";this.canvasOrigin.style.position="relative";this.canvasOrigin.style.left="50%";this.canvasOrigin.style.top="50%";this.container.appendChild(this.canvasOrigin);this.viewport=document.createElement("div");this.viewport.style.WebkitTransformOrigin="0px 0px 0px";this.viewport.style.WebkitTransformStyle="preserve-3d";this.canvasOrigin.appendChild(this.viewport);this.world=document.createElement("div");this.world.style.WebkitTransformOrigin="0px 0px 0px";this.world.style.WebkitTransformStyle="preserve-3d";this.viewport.appendChild(this.world);this.browser.removeAllChildren(this.world);this.view=null;this.mvMatrix=new bigshot.TransformStack();this.yaw=0;this.pitch=0;this.fov=0;this.pMatrix=new bigshot.TransformStack();this.onresize=function(){};this.viewportSize=null};bigshot.CSS3DVRRenderer.prototype={browser:new bigshot.Browser(),dispose:function(){},createTileCache:function(c,a,b){return new bigshot.ImageVRTileCache(c,a,b)},createTexturedQuadScene:function(){return new bigshot.CSS3DTexturedQuadScene(this.world,128,this.view)},createTexturedQuad:function(d,b,a,c){return new bigshot.CSS3DTexturedQuad(d,b,a,c)},getElement:function(){return this.container},supportsUpdate:function(){return false},getViewportWidth:function(){if(this.viewportSize){return this.viewportSize.w}return this.browser.getElementSize(this.container).w},getViewportHeight:function(){if(this.viewportSize){return this.viewportSize.h}return this.browser.getElementSize(this.container).h},onresize:function(){},resize:function(a,b){if(this.container.style.width!=""){this.container.style.width=a+"px"}if(this.container.style.height!=""){this.container.style.height=b+"px"}},beginRender:function(e,c,j,g){this.viewportSize=this.browser.getElementSize(this.container);this.yaw=e.y;this.pitch=e.p;this.fov=c;var b=0.5*c*Math.PI/180;var a=this.getViewportHeight()/2;var f=a/Math.tan(b);this.mvMatrix.reset();this.view=j;this.mvMatrix.translate(this.view);this.mvMatrix.rotateZ(g.r);this.mvMatrix.rotateX(g.p);this.mvMatrix.rotateY(g.y);this.mvMatrix.rotateY(this.yaw);this.mvMatrix.rotateX(this.pitch);this.pMatrix.reset();this.pMatrix.perspective(this.fov,this.getViewportWidth()/this.getViewportHeight(),0.1,100);this.mvpMatrix=this.pMatrix.matrix().multiply(this.mvMatrix.matrix());this.canvasOrigin.style.WebkitPerspective=f+"px";for(var d=this.world.children.length-1;d>=0;--d){this.world.children[d].inWorld=1}this.world.style.WebkitTransform="rotate3d(1,0,0,"+(-e.p)+"deg) rotate3d(0,1,0,"+e.y+"deg) rotate3d(0,1,0,"+(g.y)+"deg) rotate3d(1,0,0,"+(-g.p)+"deg) rotate3d(0,0,1,"+(-g.r)+"deg) ";this.world.style.WebkitTransformStyle="preserve-3d";this.world.style.WebKitBackfaceVisibility="hidden";this.viewport.style.WebkitTransform="translateZ("+f+"px)"},endRender:function(){for(var a=this.world.children.length-1;a>=0;--a){var b=this.world.children[a];if(!b.inWorld||b.inWorld!=2){delete b.inWorld;this.world.removeChild(b)}}this.viewportSize=null}};bigshot.Object.extend(bigshot.CSS3DVRRenderer,bigshot.AbstractVRRenderer);bigshot.Object.validate("bigshot.CSS3DVRRenderer",bigshot.VRRenderer);bigshot.CSS3DTexturedQuad=function(d,b,a,c){this.p=d;this.u=b;this.v=a;this.image=c};bigshot.CSS3DTexturedQuad.prototype={crossProduct:function crossProduct(d,c){return{x:d.y*c.z-d.z*c.y,y:d.z*c.x-d.x*c.z,z:d.x*c.y-d.y*c.x}},vecToStr:function vecToStr(a){return(a.x)+","+(a.y)+","+(a.z)},quadTransform:function quadTransform(c,d,b){var a=this.crossProduct(d,b);var e="matrix3d("+this.vecToStr(d)+",0,"+this.vecToStr(b)+",0,"+this.vecToStr(a)+",0,"+this.vecToStr(c)+",1)";return e},norm:function norm(a){return Math.sqrt(a.x*a.x+a.y*a.y+a.z*a.z)},render:function render(e,i,a){var d=i/(this.image.width-1);var g=i*1;var f=this.p;var c=this.u;var b=this.v;this.image.style.position="absolute";if(!this.image.inWorld||this.image.inWorld!=1){e.appendChild(this.image)}this.image.inWorld=2;this.image.style.WebkitTransformOrigin="0px 0px 0px";this.image.style.WebkitTransform=this.quadTransform({x:(f.x+a.x)*g,y:(-f.y+a.y)*g,z:(f.z+a.z)*g},{x:c.x*d,y:-c.y*d,z:c.z*d},{x:b.x*d,y:-b.y*d,z:b.z*d})}};bigshot.CSS3DTexturedQuadScene=function(b,c,a){this.quads=new Array();this.world=b;this.scale=c;this.view=a};bigshot.CSS3DTexturedQuadScene.prototype={addQuad:function(a){this.quads.push(a)},render:function(){for(var a=0;a<this.quads.length;++a){this.quads[a].render(this.world,this.scale,this.view)}}};bigshot.TexturedQuadScene=function(){};bigshot.TexturedQuadScene.prototype={addQuad:function(a){},render:function(){}};bigshot.WebGLVRRenderer=function(a){this.container=a;this.canvas=document.createElement("canvas");this.canvas.width=480;this.canvas.height=480;this.canvas.style.position="absolute";this.container.appendChild(this.canvas);this.webGl=new bigshot.WebGL(this.canvas);this.webGl.initShaders();this.webGl.gl.clearColor(0,0,0,1);this.webGl.gl.blendFunc(this.webGl.gl.ONE,this.webGl.gl.ZERO);this.webGl.gl.enable(this.webGl.gl.BLEND);this.webGl.gl.disable(this.webGl.gl.DEPTH_TEST);this.webGl.gl.clearDepth(1);var b=this;this.buffers=new bigshot.TimedWeakReference(function(){return b.setupBuffers()},function(c){b.disposeBuffers(c)},1000)};bigshot.WebGLVRRenderer.prototype={createTileCache:function(c,a,b){return new bigshot.TextureTileCache(c,a,b,this.webGl)},createTexturedQuadScene:function(){return new bigshot.WebGLTexturedQuadScene(this.webGl,this.buffers)},setupBuffers:function(){var c=this.webGl.gl.createBuffer();var a=this.webGl.gl.createBuffer();this.webGl.gl.bindBuffer(this.webGl.gl.ARRAY_BUFFER,a);var d=[0,0,1,0,1,1,0,1];this.webGl.gl.bufferData(this.webGl.gl.ARRAY_BUFFER,new Float32Array(d),this.webGl.gl.STATIC_DRAW);var b=this.webGl.gl.createBuffer();this.webGl.gl.bindBuffer(this.webGl.gl.ELEMENT_ARRAY_BUFFER,b);var e=[0,2,1,0,3,2];this.webGl.gl.bufferData(this.webGl.gl.ELEMENT_ARRAY_BUFFER,new Uint16Array(e),this.webGl.gl.STATIC_DRAW);this.webGl.gl.bindBuffer(this.webGl.gl.ARRAY_BUFFER,a);this.webGl.gl.vertexAttribPointer(this.webGl.shaderProgram.textureCoordAttribute,2,this.webGl.gl.FLOAT,false,0,0);this.webGl.gl.bindBuffer(this.webGl.gl.ARRAY_BUFFER,c);this.webGl.gl.vertexAttribPointer(this.webGl.shaderProgram.vertexPositionAttribute,3,this.webGl.gl.FLOAT,false,0,0);return{vertexPositionBuffer:c,textureCoordBuffer:a,vertexIndexBuffer:b}},dispose:function(){this.buffers.dispose();this.container.removeChild(this.canvas);delete this.canvas;this.webGl.dispose();delete this.webGl},disposeBuffers:function(a){this.webGl.gl.deleteBuffer(a.vertexPositionBuffer);this.webGl.gl.deleteBuffer(a.vertexIndexBuffer);this.webGl.gl.deleteBuffer(a.textureCoordBuffer)},getElement:function(){return this.canvas},supportsUpdate:function(){return false},createTexturedQuad:function(d,b,a,c){return new bigshot.WebGLTexturedQuad(d,b,a,c)},getViewportWidth:function(){return this.webGl.gl.viewportWidth},getViewportHeight:function(){return this.webGl.gl.viewportHeight},beginRender:function(b,a,d,c){this.webGl.gl.viewport(0,0,this.webGl.gl.viewportWidth,this.webGl.gl.viewportHeight);this.webGl.pMatrix.reset();this.webGl.pMatrix.perspective(a,this.webGl.gl.viewportWidth/this.webGl.gl.viewportHeight,0.1,100);this.webGl.mvMatrix.reset();this.webGl.mvMatrix.translate(d);this.webGl.mvMatrix.rotateZ(c.r);this.webGl.mvMatrix.rotateX(c.p);this.webGl.mvMatrix.rotateY(c.y);this.webGl.mvMatrix.rotateY(b.y);this.webGl.mvMatrix.rotateX(b.p);this.mvMatrix=this.webGl.mvMatrix;this.pMatrix=this.webGl.pMatrix;this.mvpMatrix=this.pMatrix.matrix().multiply(this.mvMatrix.matrix())},endRender:function(){},resize:function(a,b){this.canvas.width=a;this.canvas.height=b;if(this.container.style.width!=""){this.container.style.width=a+"px"}if(this.container.style.height!=""){this.container.style.height=b+"px"}},onresize:function(){this.webGl.onresize()}};bigshot.Object.extend(bigshot.WebGLVRRenderer,bigshot.AbstractVRRenderer);bigshot.Object.validate("bigshot.WebGLVRRenderer",bigshot.VRRenderer);bigshot.TexturedQuad=function(){};bigshot.WebGLTexturedQuad=function(d,b,a,c){this.p=d;this.u=b;this.v=a;this.texture=c};bigshot.WebGLTexturedQuad.prototype={render:function(e,d,a,c){e.gl.bindBuffer(e.gl.ARRAY_BUFFER,d);var b=[this.p.x,this.p.y,this.p.z,this.p.x+this.u.x,this.p.y+this.u.y,this.p.z+this.u.z,this.p.x+this.u.x+this.v.x,this.p.y+this.u.y+this.v.y,this.p.z+this.u.z+this.v.z,this.p.x+this.v.x,this.p.y+this.v.y,this.p.z+this.v.z];e.gl.bufferData(e.gl.ARRAY_BUFFER,new Float32Array(b),e.gl.STATIC_DRAW);e.gl.activeTexture(e.gl.TEXTURE0);e.gl.bindTexture(e.gl.TEXTURE_2D,this.texture);e.gl.uniform1i(e.shaderProgram.samplerUniform,0);e.gl.bindBuffer(e.gl.ELEMENT_ARRAY_BUFFER,c);e.gl.drawElements(e.gl.TRIANGLES,6,e.gl.UNSIGNED_SHORT,0);e.gl.bindTexture(e.gl.TEXTURE_2D,null)}};bigshot.WebGLTexturedQuadScene=function(b,a){this.quads=new Array();this.webGl=b;this.buffers=a};bigshot.WebGLTexturedQuadScene.prototype={addQuad:function(a){this.quads.push(a)},render:function(){var a=this.buffers.get();var f=a.vertexPositionBuffer;var c=a.textureCoordBuffer;var e=a.vertexIndexBuffer;this.webGl.setMatrixUniforms();for(var d=0;d<this.quads.length;++d){this.quads[d].render(this.webGl,f,c,e)}}};bigshot.VRPanoramaParameters=function(b){this.posterSize=0;this.emptyImage=null;this.suffix=null;this.width=0;this.height=0;this.container=null;this.maxTesselation=-1;this.tileSize=0;this.overlap=0;this.basePath=null;this.fileSystemType="folder";this.fileSystem=null;this.dataLoader=new bigshot.DefaultDataLoader();this.maxTextureMagnification=1;this.textureMagFilter=null;this.textureMinFilter=null;this.minFov=2;this.maxFov=90;this.minPitch=-90;this.maxPitch=90;this.minYaw=-360;this.maxYaw=720;this.yawOffset=0;this.pitchOffset=0;this.rollOffset=0;this.onload=null;this.renderer=null;this.fling=true;this.flingScale=0.004;if(b){for(var a in b){this[a]=b[a]}}this.merge=function(d,e){for(var c in d){if(e||!this[c]){this[c]=d[c]}}};return this};bigshot.VRPanorama=function(d){bigshot.EventDispatcher.call(this);var c=this;this.parameters=d;this.maxTextureMagnification=d.maxTextureMagnification;this.container=d.container;this.browser=new bigshot.Browser();this.dragStart=null;this.dragDistance=0;this.hotspots=[];this.disposed=false;this.transformOffsets={y:d.yawOffset,p:d.pitchOffset,r:d.rollOffset};this.state={rotation:{p:0,y:0,r:0},fov:45,translation:{x:0,y:0,z:0}};this.renderer=null;if(this.parameters.renderer){if(this.parameters.renderer=="css"){this.renderer=new bigshot.CSS3DVRRenderer(this.container)}else{if(this.parameters.renderer=="webgl"){this.renderer=new bigshot.WebGLVRRenderer(this.container)}else{throw new Error("Unknown renderer: "+this.parameters.renderer)}}}else{this.renderer=bigshot.WebGLUtil.isWebGLSupported()?new bigshot.WebGLVRRenderer(this.container):new bigshot.CSS3DVRRenderer(this.container)}this.renderListeners=new Array();this.renderables=new Array();this.idleCounter=0;this.maxIdleCounter=-1;this.smoothrotatePermit=0;var f=function(g){if(g.preventDefault){g.preventDefault()}return false};this.fullScreenHandler=null;this.renderAsapPermitTaken=false;this.sizeContainer=null;var a={facesLeft:6,faceLoaded:function(){this.facesLeft--;if(this.facesLeft==0){if(c.parameters.onload){c.parameters.onload()}}}};var b=function(){a.faceLoaded()};this.vrFaces=new Array();this.vrFaces[0]=new bigshot.VRFace(this,"f",{x:-1,y:1,z:-1},2,{x:1,y:0,z:0},{x:0,y:-1,z:0},b);this.vrFaces[1]=new bigshot.VRFace(this,"b",{x:1,y:1,z:1},2,{x:-1,y:0,z:0},{x:0,y:-1,z:0},b);this.vrFaces[2]=new bigshot.VRFace(this,"l",{x:-1,y:1,z:1},2,{x:0,y:0,z:-1},{x:0,y:-1,z:0},b);this.vrFaces[3]=new bigshot.VRFace(this,"r",{x:1,y:1,z:-1},2,{x:0,y:0,z:1},{x:0,y:-1,z:0},b);this.vrFaces[4]=new bigshot.VRFace(this,"u",{x:-1,y:1,z:1},2,{x:1,y:0,z:0},{x:0,y:0,z:-1},b);this.vrFaces[5]=new bigshot.VRFace(this,"d",{x:-1,y:-1,z:-1},2,{x:1,y:0,z:0},{x:0,y:0,z:1},b);var e=function(g){if(g.clientX){return g}else{return{clientX:g.changedTouches[0].clientX,clientY:g.changedTouches[0].clientY}}};this.lastTouchStartAt=-1;this.allListeners={mousedown:function(g){c.smoothRotate();c.resetIdle();c.dragMouseDown(g);return f(g)},mouseup:function(g){c.resetIdle();c.dragMouseUp(g);return f(g)},mousemove:function(g){c.resetIdle();c.dragMouseMove(g);return f(g)},gesturestart:function(g){c.gestureStart(g);return f(g)},gesturechange:function(g){c.gestureChange(g);return f(g)},gestureend:function(g){c.gestureEnd(g);return f(g)},DOMMouseScroll:function(g){c.resetIdle();c.mouseWheel(g);return f(g)},mousewheel:function(g){c.resetIdle();c.mouseWheel(g);return f(g)},dblclick:function(g){c.mouseDoubleClick(g);return f(g)},touchstart:function(g){c.smoothRotate();c.lastTouchStartAt=new Date().getTime();c.resetIdle();c.dragMouseDown(e(g));return f(g)},touchend:function(i){c.resetIdle();var g=c.dragMouseUp(e(i));if(!g&&(c.lastTouchStartAt>new Date().getTime()-350)){c.mouseDoubleClick(e(i))}c.lastTouchStartAt=-1;return f(i)},touchmove:function(g){if(c.dragDistance>24){c.lastTouchStartAt=-1}c.resetIdle();c.dragMouseMove(e(g));return f(g)}};this.addEventListeners();this.onresizeHandler=function(g){c.onresize()};this.browser.registerListener(window,"resize",this.onresizeHandler,false);this.browser.registerListener(document.body,"orientationchange",this.onresizeHandler,false);this.setPitch(0);this.setYaw(0);this.setFov(45)};bigshot.VRPanorama.DRAG_GRAB="grab";bigshot.VRPanorama.DRAG_PAN="pan";bigshot.VRPanorama.ONRENDER_BEGIN=0;bigshot.VRPanorama.ONRENDER_END=1;bigshot.VRPanorama.ONRENDER_TEXTURE_UPDATE=0;bigshot.VRPanorama.prototype={addHotspot:function(a){this.hotspots.push(a)},getParameters:function(){return this.parameters},setTranslation:function(a,c,b){this.state.translation.x=a;this.state.translation.y=c;this.state.translation.z=b},getTranslation:function(){return this.state.translation},setFov:function(a){a=Math.min(this.parameters.maxFov,a);a=Math.max(this.parameters.minFov,a);this.state.fov=a},getFov:function(){return this.state.fov},screenToPolar:function(g,e){var c=this.screenToRayDelta(g,e);var f=$V([c.x,c.y,c.z,1]);f=Matrix.RotationX(this.getPitch()*Math.PI/180).ensure4x4().x(f);f=Matrix.RotationY(-this.getYaw()*Math.PI/180).ensure4x4().x(f);var l=f.e(1);var k=f.e(2);var j=f.e(3);var d=Math.sqrt(l*l+j*j);var a=Math.atan2(l,-j)*180/Math.PI;var i=Math.atan2(k,d)*180/Math.PI;var b={};b.yaw=(a+360)%360;b.pitch=i;return b},snapPitch:function(a){a=Math.min(this.parameters.maxPitch,a);a=Math.max(this.parameters.minPitch,a);return a},setPitch:function(a){this.state.rotation.p=this.snapPitch(a)},circleDistance:function(d,c){if(c>d){var b=(c-d);var a=((c-360)-d);return Math.abs(b)<Math.abs(a)?b:a}else{var b=(c-d);var a=(360-d)+c;return Math.abs(b)<Math.abs(a)?b:a}},circleSnapTo:function(d,e,c){var b=this.circleDistance(d,e);var a=this.circleDistance(d,c);return Math.abs(b)<Math.abs(a)?e:c},snapYaw:function(a){a%=360;if(a<0){a+=360}if(this.parameters.minYaw<this.parameters.maxYaw){if(a>this.parameters.maxYaw||a<this.parameters.minYaw){a=circleSnapTo(a,this.parameters.minYaw,this.parameters.maxYaw)}}else{if(a>this.parameters.minYaw){}else{if(a>this.parameters.maxYaw){a=circleSnapTo(a,this.parameters.minYaw,this.parameters.maxYaw)}else{}}}return a},setYaw:function(a){this.state.rotation.y=this.snapYaw(a)},getYaw:function(){return this.state.rotation.y},getPitch:function(){return this.state.rotation.p},dispose:function(){this.disposed=true;this.browser.unregisterListener(window,"resize",this.onresizeHandler,false);this.browser.unregisterListener(document.body,"orientationchange",this.onresizeHandler,false);this.removeEventListeners();for(var a=0;a<this.vrFaces.length;++a){this.vrFaces[a].dispose()}this.renderer.dispose()},createVREventData:function(b){var a=this.browser.getElementPosition(this.container);b.localX=b.clientX-a.x;b.localY=b.clientY-a.y;b.ray=this.screenToRay(b.localX,b.localY);var c=this.screenToPolar(b.localX,b.localY);b.yaw=c.yaw;b.pitch=c.pitch;b.target=this;b.currentTarget=this;return new bigshot.VREvent(b)},beginRender:function(b,a){this.onrender(bigshot.VRPanorama.ONRENDER_BEGIN,b,a);this.renderer.beginRender(this.state.rotation,this.state.fov,this.state.translation,this.transformOffsets)},addRenderListener:function(a){var b=new Array();b=b.concat(this.renderListeners);b.push(a);this.renderListeners=b},removeRenderListener:function(b){var c=new Array();c=c.concat(this.renderListeners);for(var a=0;a<c.length;++a){if(c[a]===b){c.splice(a,1);break}}this.renderListeners=c},onrender:function(d,c,b){var e=this.renderListeners;for(var a=0;a<e.length;++a){e[a](d,c,b)}},endRender:function(c,b){for(var a in this.vrFaces){this.vrFaces[a].endRender()}this.renderer.endRender();this.onrender(bigshot.VRPanorama.ONRENDER_END,c,b)},addRenderable:function(a){var b=new Array();b.concat(this.renderables);b.push(a);this.renderables=b},removeRenderable:function(b){var c=new Array();c.concat(this.renderables);for(var a=0;a<c.length;++a){if(c[a]==listener){c.splice(a,1);break}}this.renderables=c},render:function(d,c){if(!this.disposed){this.beginRender(d,c);var e=this.renderer.createTexturedQuadScene();for(var b in this.vrFaces){this.vrFaces[b].render(e)}for(var a=0;a<this.renderables.length;++a){this.renderables[a](this.renderer,e)}e.render();for(var a=0;a<this.hotspots.length;++a){this.hotspots[a].layout()}this.endRender(d,c)}},renderUpdated:function(d,c){if(!this.disposed&&this.renderer.supportsUpdate()){this.beginRender(d,c);var e=this.renderer.createTexturedQuadScene();for(var b in this.vrFaces){if(this.vrFaces[b].isUpdated()){this.vrFaces[b].render(e)}}e.render();for(var a=0;a<this.hotspots.length;++a){this.hotspots[a].layout()}this.endRender(d,c)}else{this.render(d,c)}},dragMode:bigshot.VRPanorama.DRAG_GRAB,setDragMode:function(a){this.dragMode=a},addEventListeners:function(){for(var a in this.allListeners){this.browser.registerListener(this.container,a,this.allListeners[a],false)}},removeEventListeners:function(){for(var a in this.allListeners){this.browser.unregisterListener(this.container,a,this.allListeners[a],false)}},dragMouseDown:function(a){this.dragStart={clientX:a.clientX,clientY:a.clientY};this.dragLast={clientX:a.clientX,clientY:a.clientY,dx:0,dy:0,dt:1000000,time:new Date().getTime()};this.dragDistance=0},dragMouseUp:function(i){if(this.dragStart==null||this.dragLast==null){this.dragStart=null;this.dragLast=null;return}this.dragStart=null;var l=this.dragLast.dx;var k=this.dragLast.dy;var d=Math.sqrt(l*l+k*k);var c=this.dragLast.dt;var b=new Date().getTime()-this.dragLast.time;this.dragLast=null;var j=c>0?(d/c):0;if(j>0.05&&b<250&&c>20&&this.parameters.fling){var f=this.state.fov/this.renderer.getViewportHeight();var g=new Date().getTime();var a=this.parameters.flingScale;l/=c;k/=c;this.smoothRotate(function(n){var m=new Date().getTime()-g;var e=Math.pow(2,-m*a);var o=(l*n*f)*e;return e>0.01?o:null},function(n){var m=new Date().getTime()-g;var e=Math.pow(2,-m*a);var o=(k*n*f)*e;return e>0.01?o:null},function(){return null});return true}else{this.smoothRotate();return false}},dragMouseMove:function(d){if(this.dragStart!=null&&this.currentGesture==null){if(this.dragMode==bigshot.VRPanorama.DRAG_GRAB){this.smoothRotate();var f=this.state.fov/this.renderer.getViewportHeight();var b=d.clientX-this.dragStart.clientX;var a=d.clientY-this.dragStart.clientY;this.dragDistance+=b+a;this.setYaw(this.getYaw()-b*f);this.setPitch(this.getPitch()-a*f);this.renderAsap();this.dragStart=d;var c=new Date().getTime()-this.dragLast.time;if(c>20){this.dragLast={dx:this.dragLast.clientX-d.clientX,dy:this.dragLast.clientY-d.clientY,dt:c,clientX:d.clientX,clientY:d.clientY,time:new Date().getTime()}}}else{var f=0.1*this.state.fov/this.renderer.getViewportHeight();var b=d.clientX-this.dragStart.clientX;var a=d.clientY-this.dragStart.clientY;this.dragDistance=b+a;this.smoothRotate(function(){return b*f},function(){return a*f})}}},onMouseDoubleClick:function(c,a,d){var b=this.createVREventData({type:"dblclick",clientX:c.clientX,clientY:c.clientY});this.fireEvent("dblclick",b);if(!b.defaultPrevented){this.smoothRotateToXY(a,d)}},mouseDoubleClick:function(a){var b=this.browser.getElementPosition(this.container);this.onMouseDoubleClick(a,a.clientX-b.x,a.clientY-b.y)},gestureStart:function(a){this.currentGesture={startFov:this.getFov(),scale:a.scale}},gestureEnd:function(a){this.currentGesture=null},gestureChange:function(a){if(this.currentGesture){var b=this.currentGesture.startFov/a.scale;this.setFov(b);this.renderAsap()}},setMaxTextureMagnification:function(a){this.maxTextureMagnification=a},getMaxTextureMagnification:function(){return this.maxTextureMagnification},getMinFovFromViewportAndImage:function(){var a=this.renderer.getViewportHeight()/2;var f=this.vrFaces[0].parameters.height;for(var c in this.vrFaces){f=Math.min(f,this.vrFaces[c].parameters.height)}var b=this.maxTextureMagnification*f/2;var d=a/b;var e=Math.atan(d)*180/Math.PI;return e*2},screenToRay:function(a,d){var c=this.screenToRayDelta(a,d);var b=this.renderer.transformToWorld(c);b=Matrix.RotationY(-this.transformOffsets.y*Math.PI/180).ensure4x4().xPoint3Dhom1(b);b=Matrix.RotationX(-this.transformOffsets.p*Math.PI/180).ensure4x4().xPoint3Dhom1(b);b=Matrix.RotationZ(-this.transformOffsets.r*Math.PI/180).ensure4x4().xPoint3Dhom1(b);return b},screenToRayDelta:function(j,i){var g=this.renderer.getViewportHeight()/2;var d=this.renderer.getViewportWidth()/2;var j=(j-d);var i=(i-g);var e=Math.tan((this.state.fov/2)*Math.PI/180);var f=e*this.renderer.getViewportWidth()/this.renderer.getViewportHeight();var c=j*f/d;var b=i*e/g;var a=-1;return{x:c,y:b,z:a}},smoothRotateToXY:function(a,c){var b=this.screenToPolar(a,c);this.smoothRotateTo(this.snapYaw(b.yaw),this.snapPitch(b.pitch),this.getFov(),this.state.fov/200)},ease:function(f,e,c,a){var b=c*40;if(!a){a=c/5}var d=c/1000;var g=f-e;if(g>b){g=-c}else{if(g<-b){g=c}else{if(Math.abs(g)<a){g=-g}else{if(Math.abs(g)<d){g=0}else{g=-(c*g)/(b)}}}}return g},resetIdle:function(){this.idleCounter=0},idleTick:function(){if(this.maxIdleCounter<0){return}++this.idleCounter;if(this.idleCounter==this.maxIdleCounter){this.autoRotate()}var a=this;setTimeout(function(){a.idleTick()},1000)},autoRotateWhenIdle:function(a){this.maxIdleCounter=a;this.idleCounter=0;if(a<0){return}else{if(this.maxIdleCounter>0){var b=this;setTimeout(function(){b.idleTick()},1000)}}},autoRotate:function(){var b=this;var d=this.state.fov/400;var c=d;var a=c;this.smoothRotate(function(){var e=b.getYaw()+a;if(b.parameters.minYaw<b.parameters.maxYaw){if(e>b.parameters.maxYaw||e<b.parameters.minYaw){a=-a}}else{if(e>b.parameters.minYaw){}else{if(e>b.parameters.maxYaw){a=-a}else{}}}return a},function(){return b.ease(b.getPitch(),0,c)},function(){return b.ease(b.getFov(),45,0.1)})},smoothRotateTo:function(e,d,a,c){var b=this;this.smoothRotate(function(){var g=b.circleDistance(e,b.getYaw());var f=-b.ease(0,g,c);return Math.abs(f)>0.01?f:null},function(){var f=b.ease(b.getPitch(),d,c);return Math.abs(f)>0.01?f:null},function(){var f=b.ease(b.getFov(),a,c);return Math.abs(f)>0.01?f:null})},smoothRotate:function(c,g,f){++this.smoothrotatePermit;var d=this.smoothrotatePermit;if(!g&&!c&&!f){return}var e=this;var b={dy:c,dp:g,df:f,t:new Date().getTime()};var a=function(){if(e.smoothrotatePermit==d){var i=new Date().getTime();var k=i-b.t;b.t=i;var j=false;if(b.dy){var l=b.dy(k);if(l!=null){j=true;e.setYaw(e.getYaw()+l)}else{b.dy=null}}if(b.dp){var l=b.dp(k);if(l!=null){j=true;e.setPitch(e.getPitch()+l)}else{b.dp=null}}if(b.df){var l=b.df(k);if(l!=null){j=true;e.setFov(e.getFov()+l)}else{b.df=null}}e.render();if(j){e.browser.requestAnimationFrame(a,e.renderer.getElement())}}};a()},mouseWheel:function(a){var b=0;if(!a){a=window.event}if(a.wheelDelta){b=a.wheelDelta/120;if(window.opera){b=-b}}else{if(a.detail){b=-a.detail}}if(b){this.mouseWheelHandler(b)}if(a.preventDefault){a.preventDefault()}a.returnValue=false},mouseWheelHandler:function(c){var a=this;var b=null;if(c>0){if(this.getFov()>this.parameters.minFov){b=this.getFov()*0.9}}if(c<0){if(this.getFov()<this.parameters.maxFov){b=this.getFov()/0.9}}if(b!=null){this.smoothRotate(null,null,function(){var d=(b-a.getFov())/1.5;return Math.abs(d)>0.01?d:null})}},fullScreen:function(a){if(this.fullScreenHandler){return}var d=document.createElement("div");d.style.position="absolute";d.style.fontSize="16pt";d.style.top="128px";d.style.width="100%";d.style.color="white";d.style.padding="16px";d.style.zIndex="9999";d.style.textAlign="center";d.style.opacity="0.75";d.innerHTML="<span style='border-radius: 16px; -moz-border-radius: 16px; padding: 16px; padding-left: 32px; padding-right: 32px; background:black'>Press Esc to exit full screen mode.</span>";var c=this;this.fullScreenHandler=new bigshot.FullScreen(this.container);this.fullScreenHandler.restoreSize=this.sizeContainer==null;this.fullScreenHandler.addOnResize(function(){c.onresize()});this.fullScreenHandler.addOnClose(function(){if(d.parentNode){try{div.removeChild(d)}catch(e){}}c.fullScreenHandler=null});if(a){this.fullScreenHandler.addOnClose(function(){a()})}this.removeEventListeners();this.fullScreenHandler.open();this.addEventListeners();var b=function(){c.render()};setTimeout(b,1000);setTimeout(b,2000);setTimeout(b,3000);if(this.fullScreenHandler.getRootElement()){this.fullScreenHandler.getRootElement().appendChild(d);setTimeout(function(){var f=0.75;var e=function(){f-=0.02;if(d.parentNode){if(f<=0){d.style.display="none";try{div.removeChild(d)}catch(g){}}else{d.style.opacity=f;setTimeout(e,20)}}};setTimeout(e,20)},3500)}return function(){c.removeEventListeners();c.fullScreenHandler.close();c.addEventListeners()}},onresize:function(){if(this.fullScreenHandler==null||!this.fullScreenHandler.isFullScreen){if(this.sizeContainer){var a=this.browser.getElementSize(this.sizeContainer);this.renderer.resize(a.w,a.h)}}else{this.container.style.width=window.innerWidth+"px";this.container.style.height=window.innerHeight+"px";var a=this.browser.getElementSize(this.container);this.renderer.resize(a.w,a.h)}this.renderer.onresize();this.renderAsap()},renderAsap:function(){if(!this.renderAsapPermitTaken&&!this.disposed){this.renderAsapPermitTaken=true;var a=this;this.browser.requestAnimationFrame(function(){a.renderAsapPermitTaken=false;a.render()},this.renderer.getElement())}},autoResizeContainer:function(a){this.sizeContainer=a}};bigshot.Object.extend(bigshot.VRPanorama,bigshot.EventDispatcher);bigshot.VRHotspot=function(a){this.panorama=a;this.clippingStrategy=bigshot.VRHotspot.CLIP_ADJUST(a)};bigshot.VRHotspot.CLIP_FRACTION=function(b,a){return function(f){var g={x0:Math.max(f.x,0),y0:Math.max(f.y,0),x1:Math.min(f.x+f.w,b.renderer.getViewportWidth()),y1:Math.min(f.y+f.h,b.renderer.getViewportHeight())};var e=f.w*f.h;var d=(g.x1-g.x0);var c=(g.y1-g.y0);if(d>0&&c>0){var i=d*c;return(i/e)>=a}else{return false}}};bigshot.VRHotspot.CLIP_CENTER=function(a){return function(b){var d={x:b.x+b.w/2,y:b.y+b.h/2};return d.x>=0&&d.x<a.renderer.getViewportWidth()&&d.y>=0&&d.y<a.renderer.getViewportHeight()}};bigshot.VRHotspot.CLIP_ADJUST=function(a){return function(b){if(b.x<0){b.w-=-b.x;b.x=0}if(b.y<0){b.h-=-b.y;b.y=0}if(b.x+b.w>a.renderer.getViewportWidth()){b.w=a.renderer.getViewportWidth()-b.x-1}if(b.y+b.h>a.renderer.getViewportHeight()){b.h=a.renderer.getViewportHeight()-b.y-1}return b.w>0&&b.h>0}};bigshot.VRHotspot.CLIP_ZOOM=function(a,c,b){return function(d){if(d.x>=0&&d.y>=0&&(d.x+c.w)<a.renderer.getViewportWidth()&&(d.y+c.h)<a.renderer.getViewportHeight()){d.w=c.w;d.h=c.h;return true}var f=0;if(d.x<0){f=Math.max(-d.x,f)}if(d.y<0){f=Math.max(-d.y,f)}if(d.x+c.w>a.renderer.getViewportWidth()){f=Math.max(d.x+c.w-a.renderer.getViewportWidth(),f)}if(d.y+c.h>a.renderer.getViewportHeight()){f=Math.max(d.y+c.h-a.renderer.getViewportHeight(),f)}f/=a.renderer.getViewportHeight();if(f>b){return false}var e=1/(1+f);d.w=c.w*e;d.h=c.w*e;if(d.x<0){d.x=0}if(d.y<0){d.y=0}if(d.x+d.w>a.renderer.getViewportWidth()){d.x=a.renderer.getViewportWidth()-d.w}if(d.y+d.h>a.renderer.getViewportHeight()){d.y=a.renderer.getViewportHeight()-d.h}return true}};bigshot.VRHotspot.CLIP_FADE=function(a,b){return function(c){var d=Math.min(c.x,c.y,a.renderer.getViewportWidth()-(c.x+c.w),a.renderer.getViewportHeight()-(c.y+c.h));if(d<=0){return false}else{if(d<=b){c.opacity=(d/b);return true}else{c.opacity=1;return true}}}};bigshot.VRHotspot.prototype={layout:function(){},rotate:function(d,c,b){var e=d*Math.PI/180;var a=Matrix.Rotation(e,$V([c.x,c.y,c.z])).ensure4x4();return a.xPoint3Dhom1(b)},toVector:function(c,b){var a={x:0,y:0,z:-1};a=this.rotate(-b,{x:1,y:0,z:0},a);a=this.rotate(-c,{x:0,y:1,z:0},a);return a},toScreen:function(b){var a=this.panorama.renderer.transformToScreen(b);return a},clip:function(a){return this.clippingStrategy(a)}};bigshot.VRPointHotspot=function(c,e,d,b,a,f){bigshot.VRHotspot.call(this,c);this.element=b;this.offsetX=a;this.offsetY=f;this.point=this.toVector(e,d)};bigshot.VRPointHotspot.prototype={layout:function(){var b=this.toScreen(this.point);var c=false;if(b!=null){var a=this.panorama.browser.getElementSize(this.element);b.w=a.w;b.h=a.h;b.x+=this.offsetX;b.y+=this.offsetY;if(this.clip(b)){this.element.style.top=(b.y)+"px";this.element.style.left=(b.x)+"px";this.element.style.width=(b.w)+"px";this.element.style.height=(b.h)+"px";if(b.opacity){this.element.style.opacity=b.opacity}this.element.style.visibility="inherit";c=true}}if(!c){this.element.style.visibility="hidden"}}};bigshot.Object.extend(bigshot.VRPointHotspot,bigshot.VRHotspot);bigshot.Object.validate("bigshot.VRPointHotspot",bigshot.VRHotspot);bigshot.VRRectangleHotspot=function(d,f,b,e,a,c){bigshot.VRHotspot.call(this,d);this.element=c;this.point0=this.toVector(f,b);this.point1=this.toVector(e,a)};bigshot.VRRectangleHotspot.prototype={layout:function(){var a=this.toScreen(this.point0);var d=this.toScreen(this.point1);var c=false;if(a!=null&&d!=null){var b={x:a.x,y:a.y,opacity:1,w:d.x-a.x,h:d.y-a.y};if(this.clip(b)){this.element.style.top=(b.y)+"px";this.element.style.left=(b.x)+"px";this.element.style.width=(b.w)+"px";this.element.style.height=(b.h)+"px";this.element.style.visibility="inherit";c=true}}if(!c){this.element.style.visibility="hidden"}}};bigshot.Object.extend(bigshot.VRRectangleHotspot,bigshot.VRHotspot);bigshot.Object.validate("bigshot.VRRectangleHotspot",bigshot.VRHotspot);bigshot.AdaptiveLODMonitorParameters=function(b){this.vrPanorama=null;this.targetFps=30;this.tolerance=0.3;this.rate=0.1;this.minMag=1.5;this.maxMag=16;this.hqRenderMag=1.5;this.hqRenderDelay=2000;this.hqRenderInterval=1000;if(b){for(var a in b){this[a]=b[a]}}this.merge=function(d,e){for(var c in d){if(e||!this[c]){this[c]=d[c]}}};return this};bigshot.AdaptiveLODMonitor=function(b){this.setParameters(b);this.currentAdaptiveMagnification=b.vrPanorama.getMaxTextureMagnification();this.frames=0;this.samples=0;this.renderTimeTotal=0;this.renderTimeLast=0;this.samplesLast=0;this.startTime=0;this.lastRender=0;this.hqRender=false;this.hqMode=false;this.hqRenderWaiting=false;this.enabled=true;var a=this;this.listenerFunction=function(e,d,c){a.listener(e,d,c)}};bigshot.AdaptiveLODMonitor.prototype={averageRenderTime:function(){if(this.samples>0){return this.renderTimeTotal/this.samples}else{return -1}},setParameters:function(a){this.parameters=a;this.targetTime=1000/this.parameters.targetFps;this.lowerTime=this.targetTime/(1+this.parameters.tolerance);this.upperTime=this.targetTime*(1+this.parameters.tolerance)},setEnabled:function(a){this.enabled=a},averageRenderTimeLast:function(){if(this.samples>0){return this.renderTimeLast/this.samplesLast}else{return -1}},getListener:function(){return this.listenerFunction},increaseDetail:function(){this.currentAdaptiveMagnification=Math.max(this.parameters.minMag,this.currentAdaptiveMagnification/(1+this.parameters.rate))},decreaseDetail:function(){this.currentAdaptiveMagnification=Math.min(this.parameters.maxMag,this.currentAdaptiveMagnification*(1+this.parameters.rate))},sample:function(){var b=new Date().getTime()-this.startTime;this.samples++;this.renderTimeTotal+=b;this.samplesLast++;this.renderTimeLast+=b;if(this.samplesLast>4){var a=this.renderTimeLast/this.samplesLast;if(a<this.lowerTime){this.increaseDetail()}else{if(a>this.upperTime){this.decreaseDetail()}}this.samplesLast=0;this.renderTimeLast=0}},hqRenderTick:function(){if(this.lastRender<new Date().getTime()-this.parameters.hqRenderDelay){this.hqRender=true;this.hqMode=true;if(this.enabled){this.parameters.vrPanorama.setMaxTextureMagnification(this.parameters.hqRenderMag);this.parameters.vrPanorama.render()}this.hqRender=false;this.hqRenderWaiting=false}else{var a=this;setTimeout(function(){a.hqRenderTick()},this.parameters.hqRenderInterval)}},listener:function(d,c,b){if(!this.enabled){return}if(this.hqRender){return}if(this.hqMode&&c==bigshot.VRPanorama.ONRENDER_TEXTURE_UPDATE){this.parameters.vrPanorama.setMaxTextureMagnification(this.parameters.minMag);return}else{this.hqMode=false}this.parameters.vrPanorama.setMaxTextureMagnification(this.currentAdaptiveMagnification);this.frames++;if((this.frames<20||this.frames%5==0)&&d==bigshot.VRPanorama.ONRENDER_BEGIN){this.startTime=new Date().getTime();this.lastRender=this.startTime;var a=this;setTimeout(function(){a.sample()},1);if(!this.hqRenderWaiting){this.hqRenderWaiting=true;setTimeout(function(){a.hqRenderTick()},this.parameters.hqRenderInterval)}}}}};

;(function(factory) {
    'use strict';
    /* global window: false, define: false, module: false */
    var root = typeof window === 'undefined' ? null : window;

    if (typeof define === 'function' && define.amd) {
        define(function(){ return factory(root); });
    } else if (typeof module !== 'undefined') {
        module.exports = factory(root);
    } else {
        root.DOMPurify = factory(root);
    }
}(function factory(window) {
    'use strict';

    var DOMPurify = function(window) {
        return factory(window);
    };

    /**
     * Version label, exposed for easier checks
     * if DOMPurify is up to date or not
     */
    DOMPurify.version = '0.8.6';

    /**
     * Array of elements that DOMPurify removed during sanitation.
     * Empty if nothing was removed.
     */
    DOMPurify.removed = [];

    if (!window || !window.document || window.document.nodeType !== 9) {
        // not running in a browser, provide a factory function
        // so that you can pass your own Window
        DOMPurify.isSupported = false;
        return DOMPurify;
    }

    var document = window.document;
    var originalDocument = document;
    var DocumentFragment = window.DocumentFragment;
    var HTMLTemplateElement = window.HTMLTemplateElement;
    var Node = window.Node;
    var NodeFilter = window.NodeFilter;
    var NamedNodeMap = window.NamedNodeMap || window.MozNamedAttrMap;
    var Text = window.Text;
    var Comment = window.Comment;

    // As per issue #47, the web-components registry is inherited by a
    // new document created via createHTMLDocument. As per the spec
    // (http://w3c.github.io/webcomponents/spec/custom/#creating-and-passing-registries)
    // a new empty registry is used when creating a template contents owner
    // document, so we use that as our parent document to ensure nothing
    // is inherited.
    if (typeof HTMLTemplateElement === 'function') {
        var template = document.createElement('template');
        if (template.content && template.content.ownerDocument) {
            document = template.content.ownerDocument;
        }
    }
    var implementation = document.implementation;
    var createNodeIterator = document.createNodeIterator;
    var getElementsByTagName = document.getElementsByTagName;
    var createDocumentFragment = document.createDocumentFragment;
    var importNode = originalDocument.importNode;

    var hooks = {};

    /**
     * Expose whether this browser supports running the full DOMPurify.
     */
    DOMPurify.isSupported =
        typeof implementation.createHTMLDocument !== 'undefined' &&
        document.documentMode !== 9;

    /* Add properties to a lookup table */
    var _addToSet = function(set, array) {
        var l = array.length;
        while (l--) {
            if (typeof array[l] === 'string') {
                array[l] = array[l].toLowerCase();
            }
            set[array[l]] = true;
        }
        return set;
    };

    /* Shallow clone an object */
    var _cloneObj = function(object) {
        var newObject = {};
        var property;
        for (property in object) {
            if (object.hasOwnProperty(property)) {
                newObject[property] = object[property];
            }
        }
        return newObject;
    };

    /**
     * We consider the elements and attributes below to be safe. Ideally
     * don't add any new ones but feel free to remove unwanted ones.
     */

    /* allowed element names */
    var ALLOWED_TAGS = null;
    var DEFAULT_ALLOWED_TAGS = _addToSet({}, [

        // HTML
        'a','abbr','acronym','address','area','article','aside','audio','b',
        'bdi','bdo','big','blink','blockquote','body','br','button','canvas',
        'caption','center','cite','code','col','colgroup','content','data',
        'datalist','dd','decorator','del','details','dfn','dir','div','dl','dt',
        'element','em','fieldset','figcaption','figure','font','footer','form',
        'h1','h2','h3','h4','h5','h6','head','header','hgroup','hr','html','i',
        'img','input','ins','kbd','label','legend','li','main','map','mark',
        'marquee','menu','menuitem','meter','nav','nobr','ol','optgroup',
        'option','output','p','pre','progress','q','rp','rt','ruby','s','samp',
        'section','select','shadow','small','source','spacer','span','strike',
        'strong','style','sub','summary','sup','table','tbody','td','template',
        'textarea','tfoot','th','thead','time','tr','track','tt','u','ul','var',
        'video','wbr',

        // SVG
        'svg','altglyph','altglyphdef','altglyphitem','animatecolor',
        'animatemotion','animatetransform','circle','clippath','defs','desc',
        'ellipse','filter','font','g','glyph','glyphref','hkern','image','line',
        'lineargradient','marker','mask','metadata','mpath','path','pattern',
        'polygon','polyline','radialgradient','rect','stop','switch','symbol',
        'text','textpath','title','tref','tspan','view','vkern',

        // SVG Filters
        'feBlend','feColorMatrix','feComponentTransfer','feComposite',
        'feConvolveMatrix','feDiffuseLighting','feDisplacementMap',
        'feFlood','feFuncA','feFuncB','feFuncG','feFuncR','feGaussianBlur',
        'feMerge','feMergeNode','feMorphology','feOffset',
        'feSpecularLighting','feTile','feTurbulence',

        //MathML
        'math','menclose','merror','mfenced','mfrac','mglyph','mi','mlabeledtr',
        'mmuliscripts','mn','mo','mover','mpadded','mphantom','mroot','mrow',
        'ms','mpspace','msqrt','mystyle','msub','msup','msubsup','mtable','mtd',
        'mtext','mtr','munder','munderover',

        //Text
        '#text'
    ]);

    /* Allowed attribute names */
    var ALLOWED_ATTR = null;
    var DEFAULT_ALLOWED_ATTR = _addToSet({}, [

        // HTML
        'accept','action','align','alt','autocomplete','background','bgcolor',
        'border','cellpadding','cellspacing','checked','cite','class','clear','color',
        'cols','colspan','coords','datetime','default','dir','disabled',
        'download','enctype','face','for','headers','height','hidden','high','href',
        'hreflang','id','ismap','label','lang','list','loop', 'low','max',
        'maxlength','media','method','min','multiple','name','noshade','novalidate',
        'nowrap','open','optimum','pattern','placeholder','poster','preload','pubdate',
        'radiogroup','readonly','rel','required','rev','reversed','role','rows',
        'rowspan','spellcheck','scope','selected','shape','size','span',
        'srclang','start','src','step','style','summary','tabindex','title',
        'type','usemap','valign','value','width','xmlns',

        // SVG
        'accent-height','accumulate','additivive','alignment-baseline',
        'ascent','attributename','attributetype','azimuth','basefrequency',
        'baseline-shift','begin','bias','by','clip','clip-path','clip-rule',
        'color','color-interpolation','color-interpolation-filters','color-profile',
        'color-rendering','cx','cy','d','dx','dy','diffuseconstant','direction',
        'display','divisor','dur','edgemode','elevation','end','fill','fill-opacity',
        'fill-rule','filter','flood-color','flood-opacity','font-family','font-size',
        'font-size-adjust','font-stretch','font-style','font-variant','font-weight',
        'fx', 'fy','g1','g2','glyph-name','glyphref','gradientunits','gradienttransform',
        'image-rendering','in','in2','k','k1','k2','k3','k4','kerning','keypoints',
        'keysplines','keytimes','lengthadjust','letter-spacing','kernelmatrix',
        'kernelunitlength','lighting-color','local','marker-end','marker-mid',
        'marker-start','markerheight','markerunits','markerwidth','maskcontentunits',
        'maskunits','max','mask','mode','min','numoctaves','offset','operator',
        'opacity','order','orient','orientation','origin','overflow','paint-order',
        'path','pathlength','patterncontentunits','patterntransform','patternunits',
        'points','preservealpha','r','rx','ry','radius','refx','refy','repeatcount',
        'repeatdur','restart','result','rotate','scale','seed','shape-rendering',
        'specularconstant','specularexponent','spreadmethod','stddeviation','stitchtiles',
        'stop-color','stop-opacity','stroke-dasharray','stroke-dashoffset','stroke-linecap',
        'stroke-linejoin','stroke-miterlimit','stroke-opacity','stroke','stroke-width',
        'surfacescale','targetx','targety','transform','text-anchor','text-decoration',
        'text-rendering','textlength','u1','u2','unicode','values','viewbox',
        'visibility','vert-adv-y','vert-origin-x','vert-origin-y','word-spacing',
        'wrap','writing-mode','xchannelselector','ychannelselector','x','x1','x2',
        'y','y1','y2','z','zoomandpan',

        // MathML
        'accent','accentunder','bevelled','close','columnsalign','columnlines',
        'columnspan','denomalign','depth','display','displaystyle','fence',
        'frame','largeop','length','linethickness','lspace','lquote',
        'mathbackground','mathcolor','mathsize','mathvariant','maxsize',
        'minsize','movablelimits','notation','numalign','open','rowalign',
        'rowlines','rowspacing','rowspan','rspace','rquote','scriptlevel',
        'scriptminsize','scriptsizemultiplier','selection','separator',
        'separators','stretchy','subscriptshift','supscriptshift','symmetric',
        'voffset',

        // XML
        'xlink:href','xml:id','xlink:title','xml:space','xmlns:xlink'
    ]);

    /* Explicitly forbidden tags (overrides ALLOWED_TAGS/ADD_TAGS) */
    var FORBID_TAGS = null;

    /* Explicitly forbidden attributes (overrides ALLOWED_ATTR/ADD_ATTR) */
    var FORBID_ATTR = null;

    /* Decide if ARIA attributes are okay */
    var ALLOW_ARIA_ATTR = true;

    /* Decide if custom data attributes are okay */
    var ALLOW_DATA_ATTR = true;

    /* Decide if unknown protocols are okay */
    var ALLOW_UNKNOWN_PROTOCOLS = false;

    /* Output should be safe for jQuery's $() factory? */
    var SAFE_FOR_JQUERY = false;

    /* Output should be safe for common template engines.
     * This means, DOMPurify removes data attributes, mustaches and ERB
     */
    var SAFE_FOR_TEMPLATES = false;

    /* Specify template detection regex for SAFE_FOR_TEMPLATES mode */
    var MUSTACHE_EXPR = /\{\{[\s\S]*|[\s\S]*\}\}/gm;
    var ERB_EXPR = /<%[\s\S]*|[\s\S]*%>/gm;

    /* Decide if document with <html>... should be returned */
    var WHOLE_DOCUMENT = false;

    /* Decide if all elements (e.g. style, script) must be children of 
     * document.body. By default, browsers might move them to document.head */
    var FORCE_BODY = false;

    /* Decide if a DOM `HTMLBodyElement` should be returned, instead of a html string.
     * If `WHOLE_DOCUMENT` is enabled a `HTMLHtmlElement` will be returned instead
     */
    var RETURN_DOM = false;

    /* Decide if a DOM `DocumentFragment` should be returned, instead of a html string */
    var RETURN_DOM_FRAGMENT = false;

    /* If `RETURN_DOM` or `RETURN_DOM_FRAGMENT` is enabled, decide if the returned DOM
     * `Node` is imported into the current `Document`. If this flag is not enabled the
     * `Node` will belong (its ownerDocument) to a fresh `HTMLDocument`, created by
     * DOMPurify. */
    var RETURN_DOM_IMPORT = false;

    /* Output should be free from DOM clobbering attacks? */
    var SANITIZE_DOM = true;

    /* Keep element content when removing element? */
    var KEEP_CONTENT = true;

    /* Tags to ignore content of when KEEP_CONTENT is true */
    var FORBID_CONTENTS = _addToSet({}, [
        'audio', 'head', 'math', 'script', 'style', 'svg', 'video'
    ]);

    /* Tags that are safe for data: URIs */
    var DATA_URI_TAGS = _addToSet({}, [
        'audio', 'video', 'img', 'source', 'image'
    ]);

    /* Attributes safe for values like "javascript:" */
    var URI_SAFE_ATTRIBUTES = _addToSet({}, [
        'alt','class','for','id','label','name','pattern','placeholder',
        'summary','title','value','style','xmlns'
    ]);

    /* Keep a reference to config to pass to hooks */
    var CONFIG = null;

    /* Ideally, do not touch anything below this line */
    /* ______________________________________________ */

    var formElement = document.createElement('form');

    /**
     * _parseConfig
     *
     * @param  optional config literal
     */
    var _parseConfig = function(cfg) {
        /* Shield configuration object from tampering */
        if (typeof cfg !== 'object') {
            cfg = {};
        }

        /* Set configuration parameters */
        ALLOWED_TAGS = 'ALLOWED_TAGS' in cfg ?
            _addToSet({}, cfg.ALLOWED_TAGS) : DEFAULT_ALLOWED_TAGS;
        ALLOWED_ATTR = 'ALLOWED_ATTR' in cfg ?
            _addToSet({}, cfg.ALLOWED_ATTR) : DEFAULT_ALLOWED_ATTR;
        FORBID_TAGS = 'FORBID_TAGS' in cfg ?
            _addToSet({}, cfg.FORBID_TAGS) : {};
        FORBID_ATTR = 'FORBID_ATTR' in cfg ?
            _addToSet({}, cfg.FORBID_ATTR) : {};
        ALLOW_ARIA_ATTR     = cfg.ALLOW_ARIA_ATTR     !== false; // Default true
        ALLOW_DATA_ATTR     = cfg.ALLOW_DATA_ATTR     !== false; // Default true
        ALLOW_UNKNOWN_PROTOCOLS = cfg.ALLOW_UNKNOWN_PROTOCOLS || false; // Default false
        SAFE_FOR_JQUERY     = cfg.SAFE_FOR_JQUERY     ||  false; // Default false
        SAFE_FOR_TEMPLATES  = cfg.SAFE_FOR_TEMPLATES  ||  false; // Default false
        WHOLE_DOCUMENT      = cfg.WHOLE_DOCUMENT      ||  false; // Default false
        RETURN_DOM          = cfg.RETURN_DOM          ||  false; // Default false
        RETURN_DOM_FRAGMENT = cfg.RETURN_DOM_FRAGMENT ||  false; // Default false
        RETURN_DOM_IMPORT   = cfg.RETURN_DOM_IMPORT   ||  false; // Default false
        FORCE_BODY          = cfg.FORCE_BODY          ||  false; // Default false
        SANITIZE_DOM        = cfg.SANITIZE_DOM        !== false; // Default true
        KEEP_CONTENT        = cfg.KEEP_CONTENT        !== false; // Default true

        if (SAFE_FOR_TEMPLATES) {
            ALLOW_DATA_ATTR = false;
        }

        if (RETURN_DOM_FRAGMENT) {
            RETURN_DOM = true;
        }

        /* Merge configuration parameters */
        if (cfg.ADD_TAGS) {
            if (ALLOWED_TAGS === DEFAULT_ALLOWED_TAGS) {
                ALLOWED_TAGS = _cloneObj(ALLOWED_TAGS);
            }
            _addToSet(ALLOWED_TAGS, cfg.ADD_TAGS);
        }
        if (cfg.ADD_ATTR) {
            if (ALLOWED_ATTR === DEFAULT_ALLOWED_ATTR) {
                ALLOWED_ATTR = _cloneObj(ALLOWED_ATTR);
            }
            _addToSet(ALLOWED_ATTR, cfg.ADD_ATTR);
        }
        if (cfg.ADD_URI_SAFE_ATTR) {
            _addToSet(URI_SAFE_ATTRIBUTES, cfg.ADD_URI_SAFE_ATTR);
        }

        /* Add #text in case KEEP_CONTENT is set to true */
        if (KEEP_CONTENT) { ALLOWED_TAGS['#text'] = true; }

        // Prevent further manipulation of configuration.
        // Not available in IE8, Safari 5, etc.
        if (Object && 'freeze' in Object) { Object.freeze(cfg); }

        CONFIG = cfg;
    };

   /**
     * _forceRemove
     *
     * @param  a DOM node
     */
    var _forceRemove = function(node) {
        DOMPurify.removed.push({element: node});
        try {
            node.parentNode.removeChild(node);
        } catch (e) {
            node.outerHTML = '';
        }
    };

   /**
     * _removeAttribute
     *
     * @param  an Attribute name
     * @param  a DOM node
     */
    var _removeAttribute = function(name, node) {
        DOMPurify.removed.push({
            attribute: node.getAttributeNode(name),
            from: node
        });
        node.removeAttribute(name);
    };

   /**
     * _initDocument
     *
     * @param  a string of dirty markup
     * @return a DOM, filled with the dirty markup
     */
    var _initDocument = function(dirty) {
        /* Create a HTML document */
        var doc, body;
        
        if (FORCE_BODY) {
            dirty = '<remove></remove>' + dirty;
        }

        if (!doc || !doc.documentElement) {
            doc = implementation.createHTMLDocument('');
            body = doc.body;
            body.parentNode.removeChild(body.parentNode.firstElementChild);
            body.outerHTML = dirty;
        }

        /* Work on whole document or just its body */
        if (typeof doc.getElementsByTagName === 'function') {
            return doc.getElementsByTagName(
                WHOLE_DOCUMENT ? 'html' : 'body')[0];
        }
        return getElementsByTagName.call(doc,
            WHOLE_DOCUMENT ? 'html' : 'body')[0];
    };

    /**
     * _createIterator
     *
     * @param  document/fragment to create iterator for
     * @return iterator instance
     */
    var _createIterator = function(root) {
        return createNodeIterator.call(root.ownerDocument || root,
            root,
            NodeFilter.SHOW_ELEMENT
            | NodeFilter.SHOW_COMMENT
            | NodeFilter.SHOW_TEXT,
            function() { return NodeFilter.FILTER_ACCEPT; },
            false
        );
    };

    /**
     * _isClobbered
     *
     * @param  element to check for clobbering attacks
     * @return true if clobbered, false if safe
     */
    var _isClobbered = function(elm) {
        if (elm instanceof Text || elm instanceof Comment) {
            return false;
        }
        if (  typeof elm.nodeName !== 'string'
           || typeof elm.textContent !== 'string'
           || typeof elm.removeChild !== 'function'
           || !(elm.attributes instanceof NamedNodeMap)
           || typeof elm.removeAttribute !== 'function'
           || typeof elm.setAttribute !== 'function'
        ) {
            return true;
        }
        return false;
    };

    /**
     * _isNode
     *
     * @param object to check whether it's a DOM node
     * @return true is object is a DOM node
     */
    var _isNode = function(obj) {
        return (
            typeof Node === "object" ? obj instanceof Node : obj
                && typeof obj === "object" && typeof obj.nodeType === "number"
                && typeof obj.nodeName==="string"
        );
    };

    /**
     * _sanitizeElements
     *
     * @protect nodeName
     * @protect textContent
     * @protect removeChild
     *
     * @param   node to check for permission to exist
     * @return  true if node was killed, false if left alive
     */
    var _sanitizeElements = function(currentNode) {
        var tagName, content;

        /* Execute a hook if present */
        _executeHook('beforeSanitizeElements', currentNode, null);

        /* Check if element is clobbered or can clobber */
        if (_isClobbered(currentNode)) {
            _forceRemove(currentNode);
            return true;
        }

        /* Now let's check the element's type and name */
        tagName = currentNode.nodeName.toLowerCase();

        /* Execute a hook if present */
        _executeHook('uponSanitizeElement', currentNode, {
            tagName: tagName,
            allowedTags: ALLOWED_TAGS
        });

        /* Remove element if anything forbids its presence */
        if (!ALLOWED_TAGS[tagName] || FORBID_TAGS[tagName]) {
            /* Keep content except for black-listed elements */
            if (KEEP_CONTENT && !FORBID_CONTENTS[tagName]
                    && typeof currentNode.insertAdjacentHTML === 'function') {
                try {
                    currentNode.insertAdjacentHTML('AfterEnd', currentNode.innerHTML);
                } catch (e) {}
            }
            _forceRemove(currentNode);
            return true;
        }

        /* Convert markup to cover jQuery behavior */
        if (SAFE_FOR_JQUERY && !currentNode.firstElementChild &&
                (!currentNode.content || !currentNode.content.firstElementChild) &&
                /</g.test(currentNode.textContent)) {
            DOMPurify.removed.push({element: currentNode.cloneNode()});
            currentNode.innerHTML = currentNode.textContent.replace(/</g, '&lt;');
        }

        /* Sanitize element content to be template-safe */
        if (SAFE_FOR_TEMPLATES && currentNode.nodeType === 3) {
            /* Get the element's text content */
            content = currentNode.textContent;
            content = content.replace(MUSTACHE_EXPR, ' ');
            content = content.replace(ERB_EXPR, ' ');
            if (currentNode.textContent !== content) {
                DOMPurify.removed.push({element: currentNode.cloneNode()});
                currentNode.textContent = content;
            }
        }

        /* Execute a hook if present */
        _executeHook('afterSanitizeElements', currentNode, null);

        return false;
    };

    var DATA_ATTR = /^data-[\-\w.\u00B7-\uFFFF]/;
    var ARIA_ATTR = /^aria-[\-\w]+$/;
    var IS_ALLOWED_URI = /^(?:(?:(?:f|ht)tps?|mailto|tel):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i;
    var IS_SCRIPT_OR_DATA = /^(?:\w+script|data):/i;
    /* This needs to be extensive thanks to Webkit/Blink's behavior */
    var ATTR_WHITESPACE = /[\x00-\x20\xA0\u1680\u180E\u2000-\u2029\u205f\u3000]/g;

    /**
     * _sanitizeAttributes
     *
     * @protect attributes
     * @protect nodeName
     * @protect removeAttribute
     * @protect setAttribute
     *
     * @param   node to sanitize
     * @return  void
     */
    var _sanitizeAttributes = function(currentNode) {
        var attr, name, value, lcName, idAttr, attributes, hookEvent, l;
        /* Execute a hook if present */
        _executeHook('beforeSanitizeAttributes', currentNode, null);

        attributes = currentNode.attributes;

        /* Check if we have attributes; if not we might have a text node */
        if (!attributes) { return; }

        hookEvent = {
            attrName: '',
            attrValue: '',
            keepAttr: true,
            allowedAttributes: ALLOWED_ATTR
        };
        l = attributes.length;

        /* Go backwards over all attributes; safely remove bad ones */
        while (l--) {
            attr = attributes[l];
            name = attr.name;
            value = attr.value.trim();
            lcName = name.toLowerCase();

            /* Execute a hook if present */
            hookEvent.attrName = lcName;
            hookEvent.attrValue = value;
            hookEvent.keepAttr = true;
            _executeHook('uponSanitizeAttribute', currentNode, hookEvent );
            value = hookEvent.attrValue;

            /* Remove attribute */
            // Safari (iOS + Mac), last tested v8.0.5, crashes if you try to
            // remove a "name" attribute from an <img> tag that has an "id"
            // attribute at the time.
            if (lcName === 'name'  &&
                    currentNode.nodeName === 'IMG' && attributes.id) {
                idAttr = attributes.id;
                attributes = Array.prototype.slice.apply(attributes);
                _removeAttribute('id', currentNode);
                _removeAttribute(name, currentNode);
                if (attributes.indexOf(idAttr) > l) {
                    currentNode.setAttribute('id', idAttr.value);
                }
            } else if (
                  // This works around a bug in Safari, where input[type=file] 
                  // cannot be dynamically set after type has been removed
                  currentNode.nodeName === 'INPUT' && lcName === 'type' && 
                  value === 'file' && (ALLOWED_ATTR[lcName] || !FORBID_ATTR[lcName])) {
                  continue;
                
            } else {
                // This avoids a crash in Safari v9.0 with double-ids.
                // The trick is to first set the id to be empty and then to
                // remove the attriubute
                if (name === 'id') {
                    currentNode.setAttribute(name, '');
                }
                _removeAttribute(name, currentNode);
            }

            /* Did the hooks approve of the attribute? */
            if (!hookEvent.keepAttr) {
                continue;
            }

            /* Make sure attribute cannot clobber */
            if (SANITIZE_DOM &&
                    (lcName === 'id' || lcName === 'name') &&
                    (value in window || value in document || value in formElement)) {
                continue;
            }

            /* Sanitize attribute content to be template-safe */
            if (SAFE_FOR_TEMPLATES) {
                value = value.replace(MUSTACHE_EXPR, ' ');
                value = value.replace(ERB_EXPR, ' ');
            }

            /* Allow valid data-* attributes: At least one character after "-"
               (https://html.spec.whatwg.org/multipage/dom.html#embedding-custom-non-visible-data-with-the-data-*-attributes)
               XML-compatible (https://html.spec.whatwg.org/multipage/infrastructure.html#xml-compatible and http://www.w3.org/TR/xml/#d0e804)
               We don't need to check the value; it's always URI safe. */
            if (ALLOW_DATA_ATTR && DATA_ATTR.test(lcName)) {
                // This attribute is safe
            }
            else if (ALLOW_ARIA_ATTR && ARIA_ATTR.test(lcName)) {
                // This attribute is safe
            }
            /* Otherwise, check the name is permitted */
            else if (!ALLOWED_ATTR[lcName] || FORBID_ATTR[lcName]) {
                continue;
            }
            /* Check value is safe. First, is attr inert? If so, is safe */
            else if (URI_SAFE_ATTRIBUTES[lcName]) {
                // This attribute is safe
            }
            /* Check no script, data or unknown possibly unsafe URI
               unless we know URI values are safe for that attribute */
            else if (IS_ALLOWED_URI.test(value.replace(ATTR_WHITESPACE,''))) {
                // This attribute is safe
            }
            /* Keep image data URIs alive if src/xlink:href is allowed */
            else if (
                (lcName === 'src' || lcName === 'xlink:href') &&
                value.indexOf('data:') === 0 &&
                DATA_URI_TAGS[currentNode.nodeName.toLowerCase()]) {
                // This attribute is safe
            }
            /* Allow unknown protocols: This provides support for links that
               are handled by protocol handlers which may be unknown ahead of
               time, e.g. fb:, spotify: */
            else if (
                ALLOW_UNKNOWN_PROTOCOLS &&
                !IS_SCRIPT_OR_DATA.test(value.replace(ATTR_WHITESPACE,''))) {
                // This attribute is safe
            }
            /* Check for binary attributes */
            else if (!value) {
                // binary attributes are safe at this point
            }
            /* Anything else, presume unsafe, do not add it back */
            else {
                continue;
            }

            /* Handle invalid data-* attribute set by try-catching it */
            try {
                currentNode.setAttribute(name, value);
                DOMPurify.removed.pop();
            } catch (e) {}
        }

        /* Execute a hook if present */
        _executeHook('afterSanitizeAttributes', currentNode, null);
    };

    /**
     * _sanitizeShadowDOM
     *
     * @param  fragment to iterate over recursively
     * @return void
     */
    var _sanitizeShadowDOM = function(fragment) {
        var shadowNode;
        var shadowIterator = _createIterator(fragment);

        /* Execute a hook if present */
        _executeHook('beforeSanitizeShadowDOM', fragment, null);

        while ( (shadowNode = shadowIterator.nextNode()) ) {
            /* Execute a hook if present */
            _executeHook('uponSanitizeShadowNode', shadowNode, null);

            /* Sanitize tags and elements */
            if (_sanitizeElements(shadowNode)) {
                continue;
            }

            /* Deep shadow DOM detected */
            if (shadowNode.content instanceof DocumentFragment) {
                _sanitizeShadowDOM(shadowNode.content);
            }

            /* Check attributes, sanitize if necessary */
            _sanitizeAttributes(shadowNode);
        }

        /* Execute a hook if present */
        _executeHook('afterSanitizeShadowDOM', fragment, null);
    };

    /**
     * _executeHook
     * Execute user configurable hooks
     *
     * @param  {String} entryPoint  Name of the hook's entry point
     * @param  {Node} currentNode
     */
    var _executeHook = function(entryPoint, currentNode, data) {
        if (!hooks[entryPoint]) { return; }

        hooks[entryPoint].forEach(function(hook) {
            hook.call(DOMPurify, currentNode, data, CONFIG);
        });
    };

    /**
     * sanitize
     * Public method providing core sanitation functionality
     *
     * @param {String|Node} dirty string or DOM node
     * @param {Object} configuration object
     */
    DOMPurify.sanitize = function(dirty, cfg) {
        var body, importedNode, currentNode, oldNode, nodeIterator, returnNode;
        /* Make sure we have a string to sanitize.
           DO NOT return early, as this will return the wrong type if
           the user has requested a DOM object rather than a string */
        if (!dirty) {
            dirty = '<!-->';
        }

        /* Stringify, in case dirty is an object */
        if (typeof dirty !== 'string' && !_isNode(dirty)) {
            if (typeof dirty.toString !== 'function') {
                throw new TypeError('toString is not a function');
            } else {
                dirty = dirty.toString();
            }
        }

        /* Check we can run. Otherwise fall back or ignore */
        if (!DOMPurify.isSupported) {
            if (typeof window.toStaticHTML === 'object'
                || typeof window.toStaticHTML === 'function') {
                if (typeof dirty === 'string') {
                    return window.toStaticHTML(dirty);
                } else if (_isNode(dirty)) {
                    return window.toStaticHTML(dirty.outerHTML);
                }
            }
            return dirty;
        }

        /* Assign config vars */
        _parseConfig(cfg);

        /* Clean up removed elements */
        DOMPurify.removed = [];

        if (dirty instanceof Node) {
            /* If dirty is a DOM element, append to an empty document to avoid
               elements being stripped by the parser */
            body = _initDocument('<!-->');
            importedNode = body.ownerDocument.importNode(dirty, true);
            if (importedNode.nodeType === 1 && importedNode.nodeName === 'BODY') {
                /* Node is already a body, use as is */
                body = importedNode;
            } else {
                body.appendChild( importedNode );
            }
        } else {
            /* Exit directly if we have nothing to do */
            if (!RETURN_DOM && !WHOLE_DOCUMENT && dirty.indexOf('<') === -1) {
                return dirty;
            }

            /* Initialize the document to work on */
            body = _initDocument(dirty);

            /* Check we have a DOM node from the data */
            if (!body) {
                return RETURN_DOM ? null : '';
            }
        }

        /* Remove first element node (ours) if FORCE_BODY is set */
        if (FORCE_BODY) {
            _forceRemove(body.firstChild);
        }

        /* Get node iterator */
        nodeIterator = _createIterator(body);

        /* Now start iterating over the created document */
        while ( (currentNode = nodeIterator.nextNode()) ) {

            /* Fix IE's strange behavior with manipulated textNodes #89 */
            if (currentNode.nodeType === 3 && currentNode === oldNode) {
                continue;
            }

            /* Sanitize tags and elements */
            if (_sanitizeElements(currentNode)) {
                continue;
            }

            /* Shadow DOM detected, sanitize it */
            if (currentNode.content instanceof DocumentFragment) {
                _sanitizeShadowDOM(currentNode.content);
            }

            /* Check attributes, sanitize if necessary */
            _sanitizeAttributes(currentNode);

            oldNode = currentNode;
        }

        /* Return sanitized string or DOM */
        if (RETURN_DOM) {

            if (RETURN_DOM_FRAGMENT) {
                returnNode = createDocumentFragment.call(body.ownerDocument);

                while (body.firstChild) {
                    returnNode.appendChild(body.firstChild);
                }
            } else {
                returnNode = body;
            }

            if (RETURN_DOM_IMPORT) {
                /* adoptNode() is not used because internal state is not reset
                   (e.g. the past names map of a HTMLFormElement), this is safe
                   in theory but we would rather not risk another attack vector.
                   The state that is cloned by importNode() is explicitly defined
                   by the specs. */
                returnNode = importNode.call(originalDocument, returnNode, true);
            }

            return returnNode;
        }

        return WHOLE_DOCUMENT ? body.outerHTML : body.innerHTML;
    };

    /**
     * addHook
     * Public method to add DOMPurify hooks
     *
     * @param {String} entryPoint
     * @param {Function} hookFunction
     */
    DOMPurify.addHook = function(entryPoint, hookFunction) {
        if (typeof hookFunction !== 'function') { return; }
        hooks[entryPoint] = hooks[entryPoint] || [];
        hooks[entryPoint].push(hookFunction);
    };

    /**
     * removeHook
     * Public method to remove a DOMPurify hook at a given entryPoint
     * (pops it from the stack of hooks if more are present)
     *
     * @param {String} entryPoint
     * @return void
     */
    DOMPurify.removeHook = function(entryPoint) {
        if (hooks[entryPoint]) {
            hooks[entryPoint].pop();
        }
    };

    /**
     * removeHooks
     * Public method to remove all DOMPurify hooks at a given entryPoint
     *
     * @param  {String} entryPoint
     * @return void
     */
    DOMPurify.removeHooks = function(entryPoint) {
        if (hooks[entryPoint]) {
            hooks[entryPoint] = [];
        }
    };

    /**
     * removeAllHooks
     * Public method to remove all DOMPurify hooks
     *
     * @return void
     */
    DOMPurify.removeAllHooks = function() {
        hooks = {};
    };

    return DOMPurify;
}));


/**
 * Nextcloud - Gallery
 *
 *
 * This file is licensed under the Affero General Public License version 3 or
 * later. See the COPYING file.
 *
 * @author Olivier Paroz <galleryapps@oparoz.com>
 *
 * @copyright Olivier Paroz 2017
 */
/* global DOMPurify, oc_requesttoken, Gallery */

// The Utility class can also be loaded by the Files app
window.Gallery = window.Gallery || {};

(function ($, OC, t, oc_requesttoken, Gallery) {
	"use strict";
	/**
	 * Contains utility methods
	 *
	 * @fixme OC.generateUrl, OC.buildQueryString, OC.Notification are private APIs
	 *
	 * @constructor
	 */
	var Utility = function () {
	};

	Utility.prototype = {
		/**
		 * Detects if the browser is a recent or an old version of Internet Explorer
		 *
		 * @returns {string|boolean}
		 */
		getIeVersion: function () {
			// Blocking IE8
			if ($('html').is('.ie8')) {
				return 'unsupportedIe';
			} else if (navigator.userAgent.indexOf("MSIE") > 0) {
				return 'unsupportedIe';
			} else if (!!navigator.userAgent.match(/Trident.*rv[ :]*11\./)) {
				return 'modernIe';
			} else if (navigator.userAgent.indexOf("Edge/") > 0) {
				return 'edge';
			}

			return false;
		},

		/**
		 * Shows a notification to IE users, letting them know that they should use another browser
		 * in order to get the best experience
		 *
		 * @param {string} version
		 */
		showIeWarning: function (version) {
			var line1 = t('gallery', 'This application may not work properly on your browser.');
			var line2 = t('gallery',
				'For an improved experience, please install one of the following alternatives');
			var timeout = 15;
			if (version === 'unsupportedIe') {
				line1 = t('gallery', 'Your browser is not supported!');
				line2 = t('gallery', 'please install one of the following alternatives');
				timeout = 60;
			}

			var recommendedBrowsers = '</br>' +
				'<a href="http://www.getfirefox.com"><strong>Mozilla Firefox</strong></a> or ' +
				'<a href="https://www.google.com/chrome/"><strong>Google Chrome</strong></a>' +
				'</br>';

			var text = '<strong>' + line1 + '</strong></br>' + line2 + recommendedBrowsers;
			this.showHtmlNotification(text, timeout);
		},

		/**
		 * Shows a notification at the top of the screen
		 *
		 * @param {string} text
		 * @param {int} timeout
		 */
		showHtmlNotification: function (text, timeout) {
			var options = {
				timeout: timeout,
				isHTML: true
			};
			OC.Notification.showTemporary(text, options);
		},

		/**
		 * Returns the token allowing access to files shared via link
		 *
		 * @returns {string}
		 */
		getPublicToken: function () {
			var element = $('#gallery');
			var token;

			if (element.data('token')) {
				token = element.data('token');
			}

			if (element.data('requesttoken')) {
				/* jshint camelcase: false */
				oc_requesttoken = element.data('requesttoken');
			}

			return token;
		},

		/**
		 * Returns the host we can use for WebDAV
		 * 
		 * On public galleries, we need to provide the token as authorization
		 *
		 * @returns {string}
		 */
		getWebdavHost: function () {
			var host = OC.getHost();
			if (Gallery.token) {
				host = Gallery.token + '@' + host;
			}

			return host;
		},

		/**
		 * Returns the WebDAV endpoint we can use for files operations
		 *
		 * @returns {string}
		 */
		getWebdavRoot: function () {
			var root = OC.linkToRemoteBase('webdav');
			if (Gallery.token) {
				root = root.replace('remote.php', 'public.php');
			}

			return root;
		},

		/**
		 * Builds the URL which will retrieve a large preview of the file
		 *
		 * @fixme we cannot get rid of oc_requesttoken parameter as it's missing from the headers
		 *
		 * @param {number} fileId
		 * @param {number} etag
		 *
		 * @return {string}
		 */
		getPreviewUrl: function (fileId, etag) {
			var width = Math.ceil(screen.width * window.devicePixelRatio);
			var height = Math.ceil(screen.height * window.devicePixelRatio);

			/* Find value of longest edge. */
			var longEdge = Math.max(width, height);

			/* Find the next larger image size. */
			if (longEdge % 100 !== 0) {
				longEdge = ( longEdge + 100 ) - ( longEdge % 100 );
			}

			/* jshint camelcase: false */
			var params = {
				c: etag,
				width: longEdge,
				height: longEdge,
				requesttoken: oc_requesttoken
			};
			return this.buildGalleryUrl('preview', '/' + fileId, params);
		},

		/**
		 * Builds a URL pointing to one of the app's controllers
		 *
		 * @param {string} endPoint
		 * @param {undefined|string} path
		 * @param params
		 *
		 * @returns {string}
		 */
		buildGalleryUrl: function (endPoint, path, params) {
			if (path === undefined) {
				path = '';
			}
			var extension = '';
			if (Gallery.token) {
				params.token = Gallery.token;
				extension = '.public';
			}
			var query = OC.buildQueryString(params);
			return OC.generateUrl('apps/' + Gallery.appName + '/' + endPoint + extension + path,
					null) +
				'?' +
				query;
		},

		/**
		 * Builds a URL pointing to one of the files' controllers
		 *
		 * @param {string} path
		 * @param {string} files
		 *
		 * @returns {string}
		 */
		buildFilesUrl: function (path, files) {
			var subUrl = '';
			var params = {
				path: path,
				files: files
			};

			if (Gallery.token) {
				params.token = Gallery.token;
				subUrl = 's/{token}/download?dir={path}&files={files}';
			} else {
				subUrl = 'apps/files/ajax/download.php?dir={path}&files={files}';
			}

			return OC.generateUrl(subUrl, params);
		},

		/**
		 * Sorts arrays based on name or date
		 *
		 * @param {string} sortType
		 * @param {string} sortOrder
		 *
		 * @returns {Function}
		 */
		sortBy: function (sortType, sortOrder) {
			if (sortType === 'name') {
				if (sortOrder === 'asc') {
					//sortByNameAsc
					return function (a, b) {
						return OC.Util.naturalSortCompare(a.path, b.path);
					};
				}
				//sortByNameDes
				return function (a, b) {
					return -OC.Util.naturalSortCompare(a.path, b.path);
				};
			}
			if (sortType === 'date') {
				if (sortOrder === 'asc') {
					//sortByDateAsc
					return function (a, b) {
						return b.mTime - a.mTime;
					};
				}
				//sortByDateDes
				return function (a, b) {
					return a.mTime - b.mTime;
				};
			}
		},

		/**
		 * Adds hooks to DOMPurify
		 */
		addDomPurifyHooks: function () {
			// allowed URI schemes
			var whitelist = ['http', 'https'];

			// build fitting regex
			var regex = new RegExp('^(' + whitelist.join('|') + '):', 'gim');

			DOMPurify.addHook('afterSanitizeAttributes', function (node) {
				// This hook enforces URI scheme whitelist
				// @link
				// https://github.com/cure53/DOMPurify/blob/master/demos/hooks-scheme-whitelist.html

				// build an anchor to map URLs to
				var anchor = document.createElement('a');

				// check all href attributes for validity
				if (node.hasAttribute('href')) {
					anchor.href = node.getAttribute('href');
					if (anchor.protocol && !anchor.protocol.match(regex)) {
						node.removeAttribute('href');
					}
				}
				// check all action attributes for validity
				if (node.hasAttribute('action')) {
					anchor.href = node.getAttribute('action');
					if (anchor.protocol && !anchor.protocol.match(regex)) {
						node.removeAttribute('action');
					}
				}
				// check all xlink:href attributes for validity
				if (node.hasAttribute('xlink:href')) {
					anchor.href = node.getAttribute('xlink:href');
					if (anchor.protocol && !anchor.protocol.match(regex)) {
						node.removeAttribute('xlink:href');
					}
				}

				// This hook restores the proper, standard namespace in SVG files
				var encodedXmlns, decodedXmlns;

				// Restores namespaces which were put in the DOCTYPE by Illustrator
				if (node.hasAttribute('xmlns') && node.getAttribute('xmlns') === '&ns_svg;') {
					encodedXmlns = node.getAttribute('xmlns');
					decodedXmlns = encodedXmlns.replace('&ns_svg;', 'http://www.w3.org/2000/svg');
					node.setAttribute('xmlns', decodedXmlns);
				}
				if (node.hasAttribute('xmlns:xlink') &&
					node.getAttribute('xmlns:xlink') === '&ns_xlink;') {
					encodedXmlns = node.getAttribute('xmlns:xlink');
					decodedXmlns =
						encodedXmlns.replace('&ns_xlink;', 'http://www.w3.org/1999/xlink');
					node.setAttribute('xmlns:xlink', decodedXmlns);
				}
			});
		}
	};

	Gallery.Utility = Utility;
})(jQuery, OC, t, oc_requesttoken, Gallery);


/**
 * Nextcloud - Gallery
 *
 *
 * This file is licensed under the Affero General Public License version 3 or
 * later. See the COPYING file.
 *
 * @author Olivier Paroz <galleryapps@oparoz.com>
 *
 * @copyright Olivier Paroz 2017
 */
/* global oc_requesttoken, FileList, Gallery, SlideShow */
(function ($, OC, OCA, oc_requesttoken) {
	"use strict";
	var galleryFileAction = {
		features: [],
		mediaTypes: {},
		scrollContainer: null,
		slideShow: null,

		/**
		 * Builds a URL pointing to one of the app's controllers
		 *
		 * @param {string} endPoint
		 * @param {undefined|string} path
		 * @param {Object} params
		 *
		 * @returns {string}
		 */
		buildGalleryUrl: function (endPoint, path, params) {
			var extension = '';
			var tokenElement = $('#sharingToken');
			var token = (tokenElement.val()) ? tokenElement.val() : false;
			if (token) {
				params.token = token;
				extension = '.public';
			}
			var query = OC.buildQueryString(params);
			return OC.generateUrl('apps/gallery/' + endPoint + extension + path, null) + '?' +
				query;
		},

		/**
		 * Registers a file action for each media type
		 *
		 * @param {Array} mediaTypes
		 */
		register: function (mediaTypes) {
			//console.log("enabledPreviewProviders: ", mediaTypes);
			if (mediaTypes) {
				// Remove SVG if the user is using an insecure browser (IE8-9)
				if (window.galleryFileAction.features.indexOf('native_svg') > -1 && !window.btoa) {
					mediaTypes.splice(mediaTypes.indexOf('image/svg+xml'), 1);
				}
				galleryFileAction.mediaTypes = mediaTypes;
			}
			var i, mediaTypesLength = mediaTypes.length;
			// We only want to create slideshows for supported media types
			for (i = 0; i < mediaTypesLength; i++) {
				// Each click handler gets the same function and images array and
				// is responsible to load the slideshow
				OCA.Files.fileActions.register(mediaTypes[i], 'View', OC.PERMISSION_READ, '',
					galleryFileAction.onView);
				OCA.Files.fileActions.setDefault(mediaTypes[i], 'View');
			}
		},

		/**
		 * Prepares the features array
		 *
		 * This is duplicated from a method found in galleryconfig. It's done that way in order to
		 * avoid having to load the whole utility class in the Files app
		 *
		 * @param configFeatures
		 * @returns {Array}
		 */
		buildFeaturesList: function (configFeatures) {
			var features = [];
			var i, configFeaturesLength = configFeatures.length;
			if (configFeaturesLength) {
				for (i = 0; i < configFeaturesLength; i++) {
					features.push(configFeatures[i]);
				}
			}

			window.galleryFileAction.features = features;
		},

		/**
		 * Builds an array containing all the images we can show in the slideshow
		 *
		 * @param {string} filename
		 * @param {Object} context
		 */
		onView: function (filename, context) {
			var imageUrl, downloadUrl;
			var fileList = context.fileList;
			var files = fileList.files;
			var start = 0;
			var images = [];
			var dir = context.dir + '/';
			var width = Math.ceil(screen.width * window.devicePixelRatio);
			var height = Math.ceil(screen.height * window.devicePixelRatio);

			/* Find value of longest edge. */
			var longEdge = Math.max(width, height);

			/* Find the next larger image size. */
			if (longEdge % 100 !== 0) {
				longEdge = ( longEdge + 100 ) - ( longEdge % 100 );
			}

			for (var i = 0; i < files.length; i++) {
				var file = files[i];
				// We only add images to the slideshow if we think we'll be able
				// to generate previews for this media type
				if (galleryFileAction.mediaTypes.indexOf(file.mimetype) > -1) {
					/* jshint camelcase: false */
					var params = {
						width: longEdge,
						height: longEdge,
						c: file.etag,
						requesttoken: oc_requesttoken
					};
					imageUrl = galleryFileAction.buildGalleryUrl('preview', '/' + file.id, params);
					params = {
						c: file.etag,
						requesttoken: oc_requesttoken
					};
					downloadUrl =
						galleryFileAction.buildGalleryUrl('files', '/download/' + file.id, params);

					images.push({
						name: file.name,
						path: dir + file.name,
						fileId: file.id,
						mimeType: file.mimetype,
						permissions: file.permissions,
						url: imageUrl,
						downloadUrl: downloadUrl
					});
				}
			}
			for (i = 0; i < images.length; i++) {
				//console.log("Images in the slideshow : ", images[i]);
				if (images[i].name === filename) {
					start = i;
				}
			}

			if ($.isEmptyObject(galleryFileAction.slideShow)) {
				galleryFileAction.slideShow = new SlideShow();
				$.when(galleryFileAction.slideShow.init(
					false,
					null,
					window.galleryFileAction.features
				)).then(function () {
					// Don't show the download button on the "Files" slideshow
					galleryFileAction._startSlideshow(images, start);
				});
			} else {
				galleryFileAction._startSlideshow(images, start);
			}
		},

		/**
		 * Launches the slideshow
		 *
		 * @param {{name:string, url: string, path: string, fallBack: string}[]} images
		 * @param {number} start
		 * @private
		 */
		_startSlideshow: function (images, start) {
			galleryFileAction.slideShow.setImages(images, false);

			var scrollTop = galleryFileAction.scrollContainer.scrollTop();
			// This is only called when the slideshow is stopped
			galleryFileAction.slideShow.onStop = function () {
				FileList.$fileList.one('updated', function () {
					galleryFileAction.scrollContainer.scrollTop(scrollTop);
				});
			};

			// Only modern browsers can manipulate history
			if (history && history.replaceState) {
				// This stores the fileslist in the history state
				var stateData = {
					dir: FileList.getCurrentDirectory()
				};
				history.replaceState(stateData, document.title, window.location);

				// This creates a new entry in history for the slideshow. It will
				// be updated as the user navigates from picture to picture
				history.pushState(null, '', '#loading');
			}

			galleryFileAction.slideShow.show(start);
		}
	};

	window.galleryFileAction = galleryFileAction;
})(jQuery, OC, OCA, oc_requesttoken);

$(document).ready(function () {
	"use strict";
	// Deactivates fileaction on public preview page
	if ($('#imgframe').length > 0) {
		return true;
	}

	if ($('html').is('.ie8')) {
		return true; //deactivate in IE8
	}

	window.galleryFileAction.scrollContainer = $('#app-content');
	if ($('#isPublic').val()) {
		window.galleryFileAction.scrollContainer = $(window);
	}

	var utility = new Gallery.Utility();
	utility.addDomPurifyHooks();

	// Retrieve the config as well as the list of supported media types.
	// The list of media files is retrieved when the user clicks on a row
	var url = window.galleryFileAction.buildGalleryUrl('config', '', {extramediatypes: 1});
	$.getJSON(url).then(function (config) {
		window.galleryFileAction.buildFeaturesList(config.features);
		window.galleryFileAction.register(config.mediatypes);
	});
});


/**
 * Nextcloud - Gallery
 *
 *
 * This file is licensed under the Affero General Public License version 3 or
 * later. See the COPYING file.
 *
 * @author Olivier Paroz <galleryapps@oparoz.com>
 *
 * @copyright Olivier Paroz 2017
 */
/* global Gallery, Thumbnails, DOMPurify */
(function ($, OC, OCA, t) {
	"use strict";
	/**
	 * Slideshow featuring zooming
	 *
	 * @constructor
	 */
	var SlideShow = function () {
	};

	SlideShow.prototype = {
		slideshowTemplate: null,
		container: null,
		zoomablePreviewContainer: null,
		controls: null,
		imageCache: {},
		/** {Image} */
		currentImage: null,
		errorLoadingImage: false,
		onStop: null,
		zoomablePreview: null,
		active: false,
		backgroundToggle: false,
		// We need 6 hexas for comparison reasons
		darkBackgroundColour: '#000000',
		lightBackgroundColour: '#ffffff',

		/**
		 * Initialises the slideshow
		 *
		 * @param {boolean} autoPlay
		 * @param {number} interval
		 * @param {Array} features
		 */
		init: function (autoPlay, interval, features) {
			if (features.indexOf('background_colour_toggle') > -1) {
				this.backgroundToggle = true;
			}

			return $.when(this._getSlideshowTemplate()).then(function ($tmpl) {
				// Move the slideshow outside the content so we can hide the content
				$('body').append($tmpl);
				this.container = $('#slideshow');
				this.zoomablePreviewContainer = this.container.find('.bigshotContainer');
				this.zoomablePreview = new SlideShow.ZoomablePreview(this.container);
				this.controls =
					new SlideShow.Controls(
						this,
						this.container,
						this.zoomablePreview,
						interval,
						features);
				this.controls.init();

				this._initControlsAutoFader();

				// Only modern browsers can manipulate history
				if (history && history.pushState) {
					// Stop the slideshow when backing out.
					$(window).bind('popstate.slideshow', function () {
						if (this.active === true) {
							this.active = false;
							this.controls.stop();
						}
					}.bind(this));
				}
			}.bind(this)).fail(function () {
				OC.Notification.show(t('gallery', 'Error loading slideshow template'));
			});
		},

		/**
		 * Refreshes the slideshow's data
		 *
		 * @param {{name:string, url: string, path: string, fallBack: string}[]} images
		 * @param {boolean} autoPlay
		 */
		setImages: function (images, autoPlay) {
			this._hideImage();
			this.images = images;
			this.controls.update(images, autoPlay);
		},

		/**
		 * Launches the slideshow
		 *
		 * @param {number} index
		 *
		 * @returns {*}
		 */
		show: function (index) {
			this.hideErrorNotification();
			this.active = true;
			this.container.show();
			this.container.css('background-position', 'center');
			this._hideImage();
			this.container.find('.icon-loading-dark').show();
			var currentImageId = index;
			return this.loadImage(this.images[index]).then(function (img) {
				this.container.css('background-position', '-10000px 0');

				// check if we moved along while we were loading
				if (currentImageId === index) {
					var image = this.images[index];
					var transparent = this._isTransparent(image.mimeType);
					this.controls.showActionButtons(transparent, Gallery.token, image.permissions);
					this.errorLoadingImage = false;
					this.currentImage = img;
					img.setAttribute('alt', image.name);
					$(img).css('position', 'absolute');
					$(img).css('background-color', image.backgroundColour);
					if (transparent && this.backgroundToggle === true) {
						var $border = 30 / window.devicePixelRatio;
						$(img).css('outline', $border + 'px solid ' + image.backgroundColour);
					}

					this.zoomablePreview.startBigshot(img, this.currentImage, image.mimeType);

					this._setUrl(image.path);
					this.controls.show(currentImageId);
					this.container.find('.icon-loading-dark').hide();
				}
			}.bind(this), function () {
				// Don't do anything if the user has moved along while we were loading as it would
				// mess up the index
				if (currentImageId === index) {
					this.errorLoadingImage = true;
					this.showErrorNotification(null);
					this._setUrl(this.images[index].path);
					this.images.splice(index, 1);
					this.controls.updateControls(this.images, this.errorLoadingImage);
				}
			}.bind(this));
		},

		/**
		 * Loads the image to show in the slideshow and preloads the next one
		 *
		 * @param {Object} preview
		 *
		 * @returns {*}
		 */
		loadImage: function (preview) {
			var url = preview.url;
			var mimeType = preview.mimeType;

			if (!this.imageCache[url]) {
				this.imageCache[url] = new $.Deferred();
				var image = new Image();

				image.onload = function () {
					preview.backgroundColour = this._getBackgroundColour(image, mimeType);
					if (this.imageCache[url]) {
						this.imageCache[url].resolve(image);
					}
				}.bind(this);
				image.onerror = function () {
					if (this.imageCache[url]) {
						this.imageCache[url].reject(url);
					}
				}.bind(this);
				if (mimeType === 'image/svg+xml') {
					image.src = this._getSVG(url);
				} else {
					image.src = url;
				}
			}
			return this.imageCache[url];
		},

		/**
		 * Shows a new image in the slideshow and preloads the next in the list
		 *
		 * @param {number} current
		 * @param {Object} next
		 */
		next: function (current, next) {
			this.show(current).then(function () {
				// Preloads the next image in the list
				this.loadImage(next);
			}.bind(this));
		},

		/**
		 * Determines which colour to use for the background
		 *
		 * @param {*} image
		 * @param {string} mimeType
		 *
		 * @returns {string}
		 * @private
		 */
		_getBackgroundColour: function (image, mimeType) {
			var backgroundColour = this.darkBackgroundColour;
			if (this._isTransparent(mimeType) && this._isMainlyDark(image)) {
				backgroundColour = this.lightBackgroundColour;
			}
			return backgroundColour;
		},

		/**
		 * Calculates the luminance of an image to determine if an image is mainly dark
		 *
		 * @param {*} image
		 *
		 * @returns {boolean}
		 * @private
		 */
		_isMainlyDark: function (image) {
			var isMainlyDark = false;
			var numberOfSamples = 1000; // Seems to be the sweet spot
			// The name has to be 'canvas'
			var lumiCanvas = document.createElement('canvas');

			var imgArea = image.width * image.height;
			var canArea = numberOfSamples;
			var factor = Math.sqrt(canArea / imgArea);

			var scaledWidth = factor * image.width;
			var scaledHeight = factor * image.height;
			lumiCanvas.width = scaledWidth;
			lumiCanvas.height = scaledHeight;
			var lumiCtx = lumiCanvas.getContext('2d');
			lumiCtx.drawImage(image, 0, 0, scaledWidth, scaledHeight);
			var imgData = lumiCtx.getImageData(0, 0, lumiCanvas.width, lumiCanvas.height);
			var pix = imgData.data; // pix.length will be approximately 4*numberOfSamples (for RGBA)
			var pixelArraySize = pix.length;
			var totalLuminance = 0;
			var sampleNumber = 1;
			var averageLuminance;
			var totalAlpha = 0;
			var alphaLevel;
			var red = 0;
			var green = 0;
			var blue = 0;
			var alpha = 0;
			var lum = 0;
			var alphaThreshold = 0.1;

			var sampleCounter = 0;
			var itemsPerPixel = 4; // red, green, blue, alpha
			// i += 4 because 4 colours for every pixel
			for (var i = 0, n = pixelArraySize; i < n; i += itemsPerPixel) {
				sampleCounter++;
				alpha = pix[i + 3] / 255;
				totalAlpha += alpha;
				if (Math.ceil(alpha * 100) / 100 > alphaThreshold) {
					red = pix[i];
					green = pix[i + 1];
					blue = pix[i + 2];
					// Luminance formula from
					// http://stackoverflow.com/questions/596216/formula-to-determine-brightness-of-rgb-color
					lum = (red + red + green + green + green + blue) / 6;
					//lum = (red * 0.299 + green * 0.587 + blue * 0.114 );
					totalLuminance += lum * alpha;
					sampleNumber++;
				}
			}

			// Deletes the canvas
			lumiCanvas = null;

			// Calculate the optimum background colour for this image
			averageLuminance = Math.ceil((totalLuminance / sampleNumber) * 100) / 100;
			alphaLevel = Math.ceil((totalAlpha / numberOfSamples) * 100);

			if (averageLuminance < 60 && alphaLevel < 90) {
				isMainlyDark = true;
			}

			return isMainlyDark;
		},

		/**
		 * Stops the slideshow
		 */
		stop: function () {
			this.active = false;
			this.images = null;
			this._hideImage();
			if (this.onStop) {
				this.onStop();
			}
		},

		/**
		 * Sends the current image as a download
		 *
		 * @param {string} downloadUrl
		 *
		 * @returns {boolean}
		 */
		getImageDownload: function (downloadUrl) {
			OC.redirect(downloadUrl);
			return false;
		},

		/**
		 * Changes the colour of the background of the image
		 */
		toggleBackground: function () {
			var toHex = function (x) {
				return ("0" + parseInt(x).toString(16)).slice(-2);
			};
			var container = this.zoomablePreviewContainer.children('img');
			var rgb = container.css('background-color').match(/\d+/g);
			var hex = "#" + toHex(rgb[0]) + toHex(rgb[1]) + toHex(rgb[2]);
			var $border = 30 / window.devicePixelRatio;
			var newBackgroundColor;

			// Grey #363636
			if (hex === this.darkBackgroundColour) {
				newBackgroundColor = this.lightBackgroundColour;
			} else {
				newBackgroundColor = this.darkBackgroundColour;
			}

			container.css('background-color', newBackgroundColor);
			if (this.backgroundToggle === true) {
				container.css('outline', $border + 'px solid ' + newBackgroundColor);
			}
		},

		/**
		 * Shows an error notification
		 *
		 * @param {string} message
		 */
		showErrorNotification: function (message) {
			if ($.isEmptyObject(message)) {
				message = t('gallery',
					'<strong>Error!</strong> Could not generate a preview of this file.<br>' +
					'Please go to the next slide while we remove this image from the slideshow');
			}
			this.container.find('.notification').html(message);
			this.container.find('.notification').show();
			this.controls.hideButton('.changeBackground');
		},

		/**
		 * Hides the error notification
		 */
		hideErrorNotification: function () {
			this.container.find('.notification').hide();
			this.container.find('.notification').html('');
		},

		/**
		 * Removes a specific button from the interface
		 *
		 * @param button
		 */
		removeButton: function (button) {
			this.controls.removeButton(button);
		},

		/**
		 * Deletes an image from the slideshow
		 *
		 * @param {object} image
		 * @param {number} currentIndex
		 */
		deleteImage: function (image, currentIndex) {
			// These are Gallery specific commands to be replaced
			// which should sit somewhere else
			if (!window.galleryFileAction) {
				delete Gallery.imageMap[image.path];
				delete Thumbnails.map[image.file];
				Gallery.albumMap[Gallery.currentAlbum].images.splice(currentIndex, 1);
				Gallery.view.init(Gallery.currentAlbum);
			}
		},

		/**
		 * Automatically fades the controls after 3 seconds
		 *
		 * @private
		 */
		_initControlsAutoFader: function () {
			var inactiveCallback = function () {
				this.container.addClass('inactive');
			}.bind(this);
			var inactiveTimeout = setTimeout(inactiveCallback, 3000);

			this.container.on('mousemove touchstart', function () {
				this.container.removeClass('inactive');
				clearTimeout(inactiveTimeout);
				inactiveTimeout = setTimeout(inactiveCallback, 3000);
			}.bind(this));
		},

		/**
		 * Simplest way to detect if image is transparent.
		 *
		 * That's very inaccurate since it doesn't include images which support transparency
		 *
		 * @param mimeType
		 * @returns {boolean}
		 * @private
		 */
		_isTransparent: function (mimeType) {
			return !(mimeType === 'image/jpeg'
				|| mimeType === 'image/x-dcraw'
				|| mimeType === 'application/font-sfnt'
				|| mimeType === 'application/x-font'
			);
		},

		/**
		 * Changes the browser Url, based on the current image
		 *
		 * @param {string} path
		 * @private
		 */
		_setUrl: function (path) {
			if (history && history.replaceState) {
				history.replaceState('', '', '#' + encodeURI(path));
			}
		},

		/**
		 * Hides the current image (before loading the next)
		 *
		 * @private
		 */
		_hideImage: function () {
			this.zoomablePreviewContainer.empty();
			this.controls.hideActionButtons();
		},

		/**
		 * Retrieves an SVG
		 *
		 * An SVG can't be simply attached to a src attribute like a bitmap image
		 *
		 * @param {string} source
		 *
		 * @returns {*}
		 * @private
		 */
		_getSVG: function (source) {
			var svgPreview = null;
			// DOMPurify only works with IE10+ and we load SVGs in the IMG tag
			if (window.btoa &&
				document.implementation.hasFeature("http://www.w3.org/TR/SVG11/feature#Image",
					"1.1")) {
				var xmlHttp = new XMLHttpRequest();
				xmlHttp.open("GET", source, false);
				xmlHttp.send(null);
				if (xmlHttp.status === 200) {
					var pureSvg = DOMPurify.sanitize(xmlHttp.responseText, {ADD_TAGS: ['filter']});
					// Remove XML comment garbage left in the purified data
					var badTag = pureSvg.indexOf(']&gt;');
					var fixedPureSvg = pureSvg.substring(badTag < 0 ? 0 : 5, pureSvg.length);
					svgPreview = "data:image/svg+xml;base64," + window.btoa(fixedPureSvg);
				}
			}

			return svgPreview;
		},

		/**
		 * Retrieves the slideshow's template
		 *
		 * @returns {*}
		 * @private
		 */
		_getSlideshowTemplate: function () {
			var defer = $.Deferred();
			if (!this.$slideshowTemplate) {
				var self = this;
				var url = OC.generateUrl('apps/gallery/slideshow', null);
				$.get(url, function (tmpl) {
						var template = $(tmpl);
						var tmplButton;
						var buttonsArray = [
							{
								el: '.next',
								trans: t('gallery', 'Next')
							},
							{
								el: '.play',
								trans: t('gallery', 'Play'),
								toolTip: true
							},
							{
								el: '.pause',
								trans: t('gallery', 'Pause'),
								toolTip: true
							},
							{
								el: '.previous',
								trans: t('gallery', 'Previous')
							},
							{
								el: '.exit',
								trans: t('gallery', 'Close'),
								toolTip: true
							},
							{
								el: '.downloadImage',
								trans: t('gallery', 'Download'),
								toolTip: true
							},
							{
								el: '.changeBackground',
								trans: t('gallery', 'Toggle background'),
								toolTip: true
							},
							{
								el: '.deleteImage',
								trans: t('gallery', 'Delete'),
								toolTip: true
							},
							{
								el: '.shareImage',
								trans: t('gallery', 'Share'),
								toolTip: true
							}
						];
						for (var i = 0; i < buttonsArray.length; i++) {
							var button = buttonsArray[i];

							tmplButton = template.find(button.el);
							tmplButton.val(button.trans);
							if (button.toolTip) {
								tmplButton.attr("title", button.trans);
							}
						}
						self.$slideshowTemplate = template;
						defer.resolve(self.$slideshowTemplate);
					})
					.fail(function () {
						defer.reject();
					});
			} else {
				defer.resolve(this.$slideshowTemplate);
			}
			return defer.promise();
		}
	};

	window.SlideShow = SlideShow;
})(jQuery, OC, OCA, t);


/**
 * Nextcloud - Gallery
 *
 *
 * This file is licensed under the Affero General Public License version 3 or
 * later. See the COPYING file.
 *
 * @author Olivier Paroz <galleryapps@oparoz.com>
 *
 * @copyright Olivier Paroz 2017
 */
/* global OC, SlideShow */
(function ($, SlideShow) {
	"use strict";
	/**
	 * Button and key controls for the slideshow
	 *
	 * @param {Object} slideshow
	 * @param {*} container
	 * @param {Object} zoomablePreview
	 * @param {number} interval
	 * @param {Array} features
	 * @constructor
	 */
	var Controls = function (slideshow, container, zoomablePreview, interval, features) {
		this.slideshow = slideshow;
		this.container = container;
		this.zoomablePreview = zoomablePreview;
		this.progressBar = container.find('.progress');
		this.interval = interval || 5000;
		if (features.indexOf('background_colour_toggle') > -1) {
			this.backgroundToggle = true;
		}
	};

	Controls.prototype = {
		current: 0,
		errorLoadingImage: false,
		playTimeout: 0,
		playing: false,
		active: false,
		backgroundToggle: false,

		/**
		 * Initialises the controls
		 */
		init: function () {
			var makeCallBack = function (handler) {
				return function (evt) {
					if (!this.active) {
						return;
					}
					evt.stopPropagation();
					evt.preventDefault();
					handler.call(this);
				}.bind(this);
			}.bind(this);

			this._buttonSetup(makeCallBack);
			this._specialButtonSetup(makeCallBack);
			this._keyCodeSetup(makeCallBack);
		},

		/**
		 * Updates the controls
		 *
		 * @param {{name:string, url: string, path: string, fallBack: string}[]} images
		 * @param {boolean} autoPlay
		 */
		update: function (images, autoPlay) {
			this.images = images;
			this.active = true;
			this.showButton('.play');
			this.hideButton('.pause, .progress');
			this.playing = false;

			// Hide prev/next and play buttons when we only have one pic
			this.container.find('.next, .previous, .play').toggle(this.images.length > 1);

			// Hide the action buttons until we have something to show
			this.hideActionButtons();

			if (autoPlay) {
				this._playPauseToggle();
			}
		},

		/**
		 * Initialises local variables when the show starts
		 *
		 * @param {number} currentImageId
		 */
		show: function (currentImageId) {
			var currentImage = this.images[currentImageId];
			this.current = currentImageId;
			this.errorLoadingImage = false;
			if (this.playing) {
				this._setTimeout();
			}
			this._setName(currentImage.name);
		},

		/**
		 * Stops and hides the slideshow
		 */
		stop: function () {
			this._setName('');
			this.playing = false;
			this.slideshow.stop();
			this.zoomablePreview.stop();

			this._clearTimeout();
			this.container.hide();
			this.active = false;
		},

		/**
		 * Updates the private variables in case of problems loading an image
		 *
		 * @param {Array} images
		 * @param {boolean} errorLoadingImage
		 */
		updateControls: function (images, errorLoadingImage) {
			this.images = images;
			this.errorLoadingImage = errorLoadingImage;
		},

		/**
		 * Shows the action buttons
		 *
		 * @param {boolean} transparent
		 * @param {boolean} isPublic
		 * @param {number} permissions
		 */
		showActionButtons: function (transparent, isPublic, permissions) {
			if (transparent) {
				this._showBackgroundToggle();
			}
			this.showButton('.downloadImage');
			var canDelete = ((permissions & OC.PERMISSION_DELETE) !== 0);
			var canShare = ((permissions & OC.PERMISSION_SHARE) !== 0);
			if (!isPublic && canDelete) {
				this.showButton('.deleteImage');
			}
			if (!isPublic && canShare) {
				this.showButton('.shareImage');
			}
		},

		/**
		 * Hides the action buttons
		 */
		hideActionButtons: function () {
			this.hideButton('.changeBackground');
			this.hideButton('.downloadImage');
			this.hideButton('.deleteImage');
			this.hideButton('.shareImage');
		},

		/**
		 * Shows a button which has been hidden
		 */
		showButton: function (button) {
			this.container.find(button).removeClass('hidden');
		},

		/**
		 * Hides a button
		 *
		 * @param button
		 */
		hideButton: function (button) {
			this.container.find(button).addClass('hidden');
		},

		/**
		 * Removes a button
		 *
		 * @param button
		 */
		removeButton: function (button) {
			this.container.find(button).remove();
		},

		/**
		 * Sets up the button based navigation
		 *
		 * @param {Function} makeCallBack
		 * @private
		 */
		_buttonSetup: function (makeCallBack) {
			this.container.children('.next').click(makeCallBack(this._next));
			this.container.children('.previous').click(makeCallBack(this._previous));
			this.container.children('.exit').click(makeCallBack(this._exit));
			this.container.children('.pause, .play').click(makeCallBack(this._playPauseToggle));
			this.progressBar.click(makeCallBack(this._playPauseToggle));
			this.container.children('.previous, .next, .slideshow-menu, .name').on(
				'mousewheel DOMMouseScroll mousemove', function (evn) {
					this.container.children('.bigshotContainer')[0].dispatchEvent(
						new WheelEvent(evn.originalEvent.type, evn.originalEvent));
				}.bind(this));
		},

		/**
		 * Sets up additional buttons
		 *
		 * @param {Function} makeCallBack
		 * @private
		 */
		_specialButtonSetup: function (makeCallBack) {
			this.container.find('.downloadImage').click(makeCallBack(this._getImageDownload));
			this.container.find('.deleteImage').click(makeCallBack(this._deleteImage));
			this.container.find('.shareImage').click(makeCallBack(this.share));
			this.container.find('.slideshow-menu').width = 52;
			if (this.backgroundToggle) {
				this.container.find('.changeBackground').click(
					makeCallBack(this._toggleBackground));
				this.container.find('.slideshow-menu').width += 52;
			} else {
				this.hideButton('.changeBackground');
			}
		},

		/**
		 * Populates the share dialog with the needed information
		 */
		share: function () {
			var image = this.images[this.current];
			if (!Gallery.Share.droppedDown) {

				$('.slideshow-menu a.share').data('path', image.path)
					.data('link', true)
					.data('item-source', image.file)
					.data('possible-permissions', image.permissions)
					.click();
			}
		},

		/**
		 * Shows the background colour switcher, if activated in the configuration
		 */
		_showBackgroundToggle: function () {
			if (this.backgroundToggle) {
				this.showButton('.changeBackground');
			}
		},

		/**
		 * Sets up the key based controls
		 *
		 * @param {Function} makeCallBack
		 * @private
		 */
		_keyCodeSetup: function (makeCallBack) {
			$(document).keyup(function (evt) {
				if (evt.target.tagName.toLowerCase() === 'input') {
					return;
				}

				var escKey = 27;
				var leftKey = 37;
				var rightKey = 39;
				var spaceKey = 32;
				var fKey = 70;
				var zoomOutKeys = [48, 96, 79, 40]; // zeros, o or down key
				var zoomInKeys = [57, 105, 73, 38]; // 9, i or up key
				if (evt.keyCode === escKey) {
					makeCallBack(this._exit)(evt);
				} else if (evt.keyCode === leftKey) {
					makeCallBack(this._previous)(evt);
				} else if (evt.keyCode === rightKey) {
					makeCallBack(this._next)(evt);
				} else if (evt.keyCode === spaceKey) {
					makeCallBack(this._playPauseToggle)(evt);
				} else if (evt.keyCode === fKey) {
					makeCallBack(this._fullScreenToggle)(evt);
				} else if (this._hasKeyBeenPressed(evt, zoomOutKeys)) {
					makeCallBack(this._zoomToOriginal)(evt);
				} else if (this._hasKeyBeenPressed(evt, zoomInKeys)) {
					makeCallBack(this._zoomToFit)(evt);
				}
			}.bind(this));
		},

		/**
		 * Determines if a key has been pressed by comparing the event and the key
		 *
		 * @param evt
		 * @param {Array} keys
		 *
		 * @returns {boolean}
		 * @private
		 */
		_hasKeyBeenPressed: function (evt, keys) {
			var i, keysLength = keys.length;
			for (i = 0; i < keysLength; i++) {
				if (evt.keyCode === keys[i]) {
					return true;
				}
			}
			return false;
		},

		/**
		 * Starts the slideshow timer
		 *
		 * @private
		 */
		_setTimeout: function () {
			this._clearTimeout();
			this.playTimeout = setTimeout(this._next.bind(this), this.interval);
			this.progressBar.stop();
			this.progressBar.css('height', '6px');
			this.progressBar.animate({'height': '26px'}, this.interval, 'linear');
		},

		/**
		 * Stops the slideshow timer
		 *
		 * @private
		 */
		_clearTimeout: function () {
			if (this.playTimeout) {
				clearTimeout(this.playTimeout);
			}
			this.progressBar.stop();
			this.progressBar.css('height', '6px');
			this.playTimeout = 0;
		},

		/**
		 * Starts/stops autoplay and shows/hides the play/pause buttons
		 *
		 * @private
		 */
		_playPauseToggle: function () {
			if (this.playing === true) {
				this.playing = false;
				this._clearTimeout();
			} else {
				this.playing = true;
				this._setTimeout();
			}

			this.container.find('.play, .pause, .progress').toggleClass('hidden');
		},

		/**
		 * Shows the next slide
		 *
		 * @private
		 */
		_next: function () {
			if(Gallery.Share){
				Gallery.Share.hideDropDown();
			}
			this._setName('');
			this.slideshow.hideErrorNotification();
			this.zoomablePreview.reset();

			if (this.errorLoadingImage) {
				this.current -= 1;
			}
			this.current = (this.current + 1) % this.images.length;
			var next = (this.current + 1) % this.images.length;
			this._updateSlideshow(next);
		},

		/**
		 * Shows the previous slide
		 *
		 * @private
		 */
		_previous: function () {
			if(Gallery.Share){
				Gallery.Share.hideDropDown();
			}
			this._setName('');
			this.slideshow.hideErrorNotification();
			this.zoomablePreview.reset();

			this.current = (this.current - 1 + this.images.length) % this.images.length;
			var previous = (this.current - 1 + this.images.length) % this.images.length;
			this._updateSlideshow(previous);
		},

		/**
		 * Asks the slideshow for the next image
		 *
		 * @param {number} imageId
		 * @private
		 */
		_updateSlideshow: function (imageId) {
			this.slideshow.next(this.current, this.images[imageId]);
		},

		/**
		 * Exits the slideshow by going back in history
		 *
		 * @private
		 */
		_exit: function () {
			if (Gallery.Share){
				Gallery.Share.hideDropDown();
			}

			// Only modern browsers can manipulate history
			if (history && history.replaceState) {
				// We simulate a click on the back button in order to be consistent
				window.history.back();
			} else {
				// For ancient browsers supported in core
				this.stop();
			}
		},

		/**
		 * Launches fullscreen mode if the browser supports it
		 *
		 * @private
		 */
		_fullScreenToggle: function () {
			this.zoomablePreview.fullScreenToggle();
		},

		/**
		 * Resizes the image to its original size
		 *
		 * @private
		 */
		_zoomToOriginal: function () {
			this.zoomablePreview.zoomToOriginal();
		},

		/**
		 * Fits the image in the browser window
		 *
		 * @private
		 */
		_zoomToFit: function () {
			this.zoomablePreview.zoomToFit();
		},

		/**
		 * Sends the current image as a download
		 *
		 * @returns {boolean}
		 * @private
		 */
		_getImageDownload: function () {
			var downloadUrl = this.images[this.current].downloadUrl;

			return this.slideshow.getImageDownload(downloadUrl);
		},

		/**
		 * Changes the colour of the background of the image
		 *
		 * @private
		 */
		_toggleBackground: function () {
			this.slideshow.toggleBackground();
		},

		/**
		 * Shows the filename of the current image
		 * @param {string} imageName
		 * @private
		 */
		_setName: function (imageName) {
			var nameElement = this.container.find('.title');
			nameElement.text(imageName);
		},

		/**
		 * Delete the image from the slideshow
		 * @private
		 */
		_deleteImage: function () {
			var image = this.images[this.current];
			var self = this;
			$.ajax({
				type: 'DELETE',
				url: OC.getRootPath() + '/remote.php/webdav/' + image.path,
				success: function () {
					self.slideshow.deleteImage(image, self.current);
					self.images.splice(self.current, 1);
					if (self.images.length === 0) {
						self._exit();
					}
					else {
						self.current = self.current % self.images.length;
						self._updateSlideshow(self.current);
					}
				}
			});
		}
	};

	SlideShow.Controls = Controls;
})(jQuery, SlideShow);


/**
 * Nextcloud - Gallery
 *
 *
 * This file is licensed under the Affero General Public License version 3 or
 * later. See the COPYING file.
 *
 * @author Olivier Paroz <galleryapps@oparoz.com>
 *
 * @copyright Olivier Paroz 2017
 */
/* global SlideShow, bigshot*/
(function ($, SlideShow, bigshot) {
	"use strict";
	/**
	 * Creates a zoomable preview
	 *
	 * @param {*} container
	 * @constructor
	 */
	var ZoomablePreview = function (container) {
		this.container = container;
		this.element = this.container.get(0);
		var bigshotContainer = container.find('.bigshotContainer');
		this.bigshotElement = bigshotContainer.get(0);

		this._detectFullscreen();
		this._setupControls();

		$(window).resize(function () {
			this._zoomDecider();
		}.bind(this));
	};

	ZoomablePreview.prototype = {
		container: null,
		element: null,
		bigshotContainer: null,
		bigshotElement: null,
		zoomable: null,
		fullScreen: null,
		canFullScreen: false,
		currentImage: null,
		mimeType: null,
		maxZoom: 3,
		smallImageDimension: 200 / window.devicePixelRatio,
		smallImageScale: 2,

		/**
		 * Launches the Bigshot zoomable preview
		 *
		 * @param {*} image
		 * @param {number} currentImage
		 * @param {string} mimeType
		 */
		startBigshot: function (image, currentImage, mimeType) {
			this.currentImage = currentImage;
			this.mimeType = mimeType;
			if (this.zoomable !== null) {
				this.zoomable.dispose();
				this.zoomable = null;
			}
			var maxZoom = this.maxZoom;
			var imgWidth = image.naturalWidth / window.devicePixelRatio;
			var imgHeight = image.naturalHeight / window.devicePixelRatio;
			// Set arbitrary image dimension when we have a SVG
			if (imgWidth === 0 && mimeType === 'image/svg+xml') {
				imgWidth = 2048;
				imgHeight = 2048;
			}

			if (imgWidth < this.smallImageDimension &&
				imgHeight < this.smallImageDimension &&
				this.mimeType !== 'image/svg+xml') {
				maxZoom += 3;
				this.currentImage.isSmallImage = true;
			}
			this.zoomable = new bigshot.SimpleImage(new bigshot.ImageParameters({
				container: this.bigshotElement,
				maxZoom: maxZoom,
				minZoom: 0,
				touchUI: false,
				width: imgWidth,
				height: imgHeight
			}), image);

			// Reset our zoom based on image and window dimensions.
			this._resetZoom();

			// prevent zoom-on-doubleClick
			this.zoomable.addEventListener('dblclick', function (ie) {
				ie.preventDefault();
			});
			// Reset image position and size on orientation change
			var self = this;
			$(window).bind('orientationchange resize', function () {
				self._resetZoom();
			});
		},

		/**
		 * Resets the element for the next image to be displayed
		 */
		reset: function () {
			if (this.zoomable !== null) {
				this.zoomable.stopFlying();
				this._resetZoom();
			}
		},

		/**
		 * Throws away the zoomable preview
		 */
		stop: function () {
			if (this.fullScreen !== null) {
				this._fullScreenExit();
			}
			if (this.zoomable !== null) {
				this.zoomable.dispose();
				this.zoomable = null;
			}
		},

		/**
		 * Launches fullscreen mode if the browser supports it
		 */
		fullScreenToggle: function () {
			if (this.zoomable === null) {
				return;
			}
			if (this.fullScreen !== null) {
				this._fullScreenExit();
			} else {
				this._fullScreenStart();
			}
		},

		/**
		 * Resizes the image to its original size
		 */
		zoomToOriginal: function () {
			if (this.zoomable === null) {
				return;
			}
			if (this.currentImage.isSmallImage) {
				this.zoomable.flyTo(0, 0, this.smallImageScale, true);
			} else if ($(window).width() < this.zoomable.width ||
				$(window).height() < this.zoomable.height) {
				// The image is larger than the window.
				// Set minimum zoom and call flyZoomToFit.
				this.zoomable.setMinZoom(this.zoomable.getZoomToFitValue());
				this.zoomable.flyZoomToFit();
			} else {
				this.zoomable.setMinZoom(0);
				this.zoomable.flyTo(0, 0, 0, true);
			}
		},

		/**
		 * Fits the image in the browser window
		 */
		zoomToFit: function () {
			if (this.zoomable !== null) {
				this.zoomable.flyZoomToFit();
			}
		},

		/**
		 * Detect fullscreen capability
		 * @private
		 */
		_detectFullscreen: function () {
			this.canFullScreen = this.element.requestFullscreen !== undefined ||
				this.element.mozRequestFullScreen !== undefined ||
				this.element.webkitRequestFullscreen !== undefined ||
				this.element.msRequestFullscreen !== undefined;
		},

		/**
		 * Makes UI controls work on touchscreens. Pinch only works on iOS
		 * @private
		 */
		_setupControls: function () {
			var browser = new bigshot.Browser();
			this.container.children('input').each(function (i, e) {
				browser.registerListener(e, 'click', browser.stopEventBubblingHandler(), false);
				browser.registerListener(e, 'touchstart', browser.stopEventBubblingHandler(),
					false);
				browser.registerListener(e, 'touchend', browser.stopEventBubblingHandler(), false);
			});
		},

		/**
		 * Determines whether the image should be shown at its original size or if it should fill
		 * the screen
		 *
		 * @private
		 */
		_zoomDecider: function () {
			if (this.zoomable !== null) {
				if (this.fullScreen === null && this.mimeType !== 'image/svg+xml') {
					this.zoomToOriginal();
				} else {
					this.zoomToFit();
				}
			}
		},

		/**
		 * Resets the image to its original zoomed size
		 *
		 * @private
		 */
		_resetZoom: function () {
			if (this.zoomable === null) {
				return;
			}
			if (this.currentImage.isSmallImage) {
				this.zoomable.setZoom(this.smallImageScale, true);
			} else if ($(window).width() < this.zoomable.width ||
				$(window).height() < this.zoomable.height ||
				this.fullScreen !== null ||
				this.mimeType === 'image/svg+xml') {
				// The image is larger than the window, or we are fullScreen,
				// or this is an SVG. Set minimum zoom and call zoomToFit.
				this.zoomable.setMinZoom(this.zoomable.getZoomToFitValue());
				this.zoomable.zoomToFit();
			} else {
				// Zoom to the image size.
				this.zoomable.setMinZoom(0);
				this.zoomable.setZoom(0, true);
			}
		},

		/**
		 * Starts the fullscreen previews
		 *
		 * @private
		 */
		_fullScreenStart: function () {
			if (!this.canFullScreen) {
				return;
			}
			this.fullScreen = new bigshot.FullScreen(this.element);
			this.fullScreen.open();
			this.fullScreen.addOnClose(function () {
				this._fullScreenExit();
			}.bind(this));
		},

		/**
		 * Stops the fullscreen previews
		 *
		 * @private
		 */
		_fullScreenExit: function () {
			if (this.fullScreen === null) {
				return;
			}
			this.fullScreen.close();
			this.fullScreen = null;
			this._zoomDecider();

		}
	};

	SlideShow.ZoomablePreview = ZoomablePreview;
})(jQuery, SlideShow, bigshot);


/**
 * Nextcloud - Gallery
 *
 *
 * This file is licensed under the Affero General Public License version 3 or
 * later. See the COPYING file.
 *
 * @author Olivier Paroz <galleryapps@oparoz.com>
 *
 * @copyright Olivier Paroz 2017
 */
/* global OC, OCA, FileList, $, t */
var GalleryButton = {};
GalleryButton.isPublic = false;
GalleryButton.button = {};
GalleryButton.url = null;

/**
 * Rebuilds the Gallery URL every time the files list has changed
 */
GalleryButton.onFileListUpdated = function () {
	"use strict";
	var fileList;

	if (GalleryButton.isPublic) {
		fileList = OCA.Sharing.PublicApp.fileList;
	} else {
		fileList = FileList;
	}

	GalleryButton.buildGalleryUrl(fileList.getCurrentDirectory().replace(/^\//, ''));
};

/**
 * Builds the URL which will load the exact same folder in Gallery
 *
 * @param dir
 */
GalleryButton.buildGalleryUrl = function (dir) {
	"use strict";
	var params = {};
	var tokenPath = '';
	var sharingTokenElement = $('#sharingToken');
	var token = (sharingTokenElement.val()) ? sharingTokenElement.val() : false;
	if (token) {
		params.token = token;
		tokenPath = 's/{token}';
	}
	GalleryButton.url =
		OC.generateUrl('apps/gallery/' + tokenPath, params) + '#' + encodeURIComponent(dir);
};

$(document).ready(function () {
		"use strict";
		if ($('#body-login').length > 0) {
			return true; //deactivate on login page
		}

		if ($('html').is('.ie8')) {
			return true; //deactivate in IE8
		}

		if ($('#isPublic').val()) {
			GalleryButton.isPublic = true;
		}

		if ($('#filesApp').val()) {

			$('#fileList').on('updated', GalleryButton.onFileListUpdated);

			// Button for opening files list as gallery view
			GalleryButton.button =
				$('<div id="gallery-button" class="button view-switcher">' +
						'<div id="button-loading" class="hidden"></div>' +
					'<span class="icon-toggle-pictures"></span>' +
					'</div>');

			GalleryButton.button.click(function () {
				$(this).children('span').addClass('hidden');
				$(this).children('#button-loading').removeClass('hidden').addClass('icon-loading-small');
				window.location.href = GalleryButton.url;
			});

			$('#controls .actions').append(GalleryButton.button);
		}
	}
);


/* global Gallery, escapeHTML */

(function ($, Gallery) {
	"use strict";

	/**
	 * @typedef {Object} Gallery.Share.Types.ShareInfo
	 * @property {Number} share_type
	 * @property {Number} permissions
	 * @property {Number} file_source optional
	 * @property {Number} item_source
	 * @property {String} token
	 * @property {String} share_with
	 * @property {String} share_with_displayname
	 * @property {String} mail_send
	 * @property {String} displayname_file_owner
	 * @property {String} displayname_owner
	 * @property {String} uid_owner
	 * @property {String} uid_file_owner
	 * @property {String} expiration optional
	 * @property {Number} stime
	 */

	// copied and stripped out from the old core
	var Share = {
		SHARE_TYPE_USER: 0,
		SHARE_TYPE_GROUP: 1,
		SHARE_TYPE_LINK: 3,
		SHARE_TYPE_EMAIL: 4,
		SHARE_TYPE_REMOTE: 6,

		/**
		 * @deprecated use OC.Share.currentShares instead
		 */
		itemShares: [],

		/**
		 * Shares for the currently selected file.
		 * (for which the dropdown is open)
		 *
		 * Key is item type and value is an array or
		 * shares of the given item type.
		 */
		currentShares: {},

		/**
		 * Whether the share dropdown is opened.
		 */
		droppedDown: false,

		/**
		 *
		 * @param path {String} path to the file/folder which should be shared
		 * @param shareType {Number} 0 = user; 1 = group; 3 = public link; 6 = federated cloud
		 *     share
		 * @param shareWith {String} user / group id with which the file should be shared
		 * @param publicUpload {Boolean} allow public upload to a public shared folder
		 * @param password {String} password to protect public link Share with
		 * @param permissions {Number} 1 = read; 2 = update; 4 = create; 8 = delete; 16 = share; 31
		 *     = all (default: 31, for public shares: 1)
		 * @param callback {Function} method to call back after a successful share creation
		 * @param errorCallback {Function} method to call back after a failed share creation
		 *
		 * @returns {*}
		 */
		share: function (path, shareType, shareWith, publicUpload, password, permissions, callback, errorCallback) {
			return $.ajax({
				url: OC.linkToOCS('apps/files_sharing/api/v1', 2) + 'shares' + '?format=json',
				type: 'POST',
				data: {
					path: path,
					shareType: shareType,
					shareWith: shareWith,
					publicUpload: publicUpload,
					password: password,
					permissions: permissions
				},
				dataType: 'json'
			}).done(function (result) {
				if (callback) {
					callback(result.ocs.data);
				}
			}).fail(function (xhr) {
				var result = xhr.responseJSON;
				if (_.isFunction(errorCallback)) {
					errorCallback(result);
				} else {
					var msg = t('gallery', 'Error');
					if (result.ocs && result.ocs.meta.message) {
						msg = result.ocs.meta.message;
					}
					OC.dialogs.alert(msg, t('gallery', 'Error while sharing'));
				}
			});
		},
		/**
		 *
		 * @param {Number} shareId
		 * @param {Function} callback
		 */
		unshare: function (shareId, callback) {
			$.ajax({
				url: OC.linkToOCS('apps/files_sharing/api/v1', 2) + 'shares/' + shareId +
				'?format=json',
				type: 'DELETE'
			}).done(function () {
				if (callback) {
					callback();
				}
			}).fail(function () {
				OC.dialogs.alert(t('gallery', 'Error while unsharing'), t('gallery', 'Error'));

			});
		},
		/**
		 *
		 * @param {Number} shareId
		 * @param {Number} permissions
		 */
		setPermissions: function (shareId, permissions) {
			$.ajax({
				url: OC.linkToOCS('apps/files_sharing/api/v1', 2) + 'shares/' + shareId +
				'?format=json',
				type: 'PUT',
				data: {
					permissions: permissions
				}
			}).fail(function () {
				OC.dialogs.alert(t('gallery', 'Error while changing permissions'),
					t('gallery', 'Error'));
			});
		},
		/**
		 *
		 * @param {String} itemType
		 * @param {String} path
		 * @param {String} appendTo
		 * @param {String} link
		 * @param {Number} possiblePermissions
		 * @param {String} filename
		 */
		showDropDown: function (itemType, path, appendTo, link, possiblePermissions, filename) {
			// This is a sync AJAX request on the main thread...
			var data = this._loadShares(path);
			var dropDownEl;
			var self = this;
			var html = '<div id="dropdown" class="drop shareDropDown" data-item-type="' + escapeHTML(itemType) +
				'" data-item-source="' + escapeHTML(path) + '">';
			if (data !== false && data[0] && !_.isUndefined(data[0].uid_file_owner) &&
				data[0].uid_file_owner !== OC.currentUser
			) {
				html += '<span class="reshare">';
				if (oc_config.enable_avatars === true) {
					html += '<div class="avatar"></div>';
				}

				if (data[0].share_type == this.SHARE_TYPE_GROUP) {
					html += t('gallery', 'Shared with you and the group {group} by {owner}', {
						group: data[0].share_with,
						owner: data[0].displayname_owner
					});
				} else {
					html += t('gallery', 'Shared with you by {owner}',
						{owner: data[0].displayname_owner});
				}
				html += '</span><br />';
				// reduce possible permissions to what the original share allowed
				possiblePermissions = possiblePermissions & data[0].permissions;
			}

			if (possiblePermissions & OC.PERMISSION_SHARE) {
				// Determine the Allow Public Upload status.
				// Used later on to determine if the
				// respective checkbox should be checked or
				// not.
				var publicUploadEnabled = $('#gallery').data('allow-public-upload');
				if (typeof publicUploadEnabled == 'undefined') {
					publicUploadEnabled = 'no';
				}
				var allowPublicUploadStatus = false;

				$.each(data, function (key, value) {
					if (value.share_type === self.SHARE_TYPE_LINK) {
						allowPublicUploadStatus =
							(value.permissions & OC.PERMISSION_CREATE) ? true : false;
						return true;
					}
				});

				var sharePlaceholder = t('gallery', 'Share with users or groups …');
				if (oc_appconfig.core.remoteShareAllowed) {
					sharePlaceholder = t('gallery', 'Share with users, groups or remote users …');
				}

				html += '<label for="shareWith" class="hidden-visually">' + t('gallery', 'Share') +
					'</label>';
				html +=
					'<input id="shareWith" type="text" placeholder="' + sharePlaceholder + '" />';
				if (oc_appconfig.core.remoteShareAllowed) {
					var federatedCloudSharingDoc =
						'<span class="icon-info svg shareWithRemoteInfo hasTooltip" ' +
						'title="' + t('gallery',
							'Share with people on other servers using their Federated Cloud ID username@example.com/cloud') +
						'"></span>';
					html += federatedCloudSharingDoc;
				}
				html += '<span class="shareWithLoading icon-loading-small hidden"></span>';
				html += '<ul id="shareWithList">';
				html += '</ul>';
				var linksAllowed = $('#allowShareWithLink').val() === 'yes';
				if (link && linksAllowed) {
					html += '<div id="link" class="linkShare">';
					html += '<span class="icon-loading-small hidden"></span>';
					html +=
						'<input type="checkbox" class="checkbox checkbox--right" ' +
						'name="linkCheckbox" id="linkCheckbox" value="1" />' +
						'<label for="linkCheckbox">' + t('gallery', 'Share link') + '</label>';
					html += '<br />';

					var defaultExpireMessage = '';
					if ((itemType === 'folder' || itemType === 'file') &&
						oc_appconfig.core.defaultExpireDateEnforced) {
						defaultExpireMessage =
							t('gallery',
								'The public link will expire no later than {days} days after it is created',
								{'days': oc_appconfig.core.defaultExpireDate}) + '<br/>';
					}

					html += '<label for="linkText" class="hidden-visually">' + t('gallery', 'Link') +
						'</label>';
					html += '<div id="linkText-container">';
					html += '<input id="linkText" type="text" readonly="readonly" />';
					html += '<a id="linkTextMore" class="button icon-more" href="#"></a>';
					html += '<div id="linkSocial" class="popovermenu bubble menu hidden"></div>';
					html += '</div>';

					html +=
						'<input type="checkbox" class="checkbox checkbox--right" ' +
						'name="showPassword" id="showPassword" value="1" />' +
						'<label for="showPassword" style="display:none;">' +
						t('gallery', 'Password protect') + '</label>';
					html += '<div id="linkPass">';
					html += '<label for="linkPassText" class="hidden-visually">' +
						t('gallery', 'Password') + '</label>';
					html += '<input id="linkPassText" type="password" placeholder="' +
						t('gallery', 'Choose a password for the public link') + '" />';
					html += '<span class="icon-loading-small hidden"></span>';
					html += '</div>';

					if (itemType === 'folder' && (possiblePermissions & OC.PERMISSION_CREATE) &&
						publicUploadEnabled === 'yes') {
						html += '<div id="allowPublicUploadWrapper" style="display:none;">';
						html += '<span class="icon-loading-small hidden"></span>';
						html +=
							'<input type="checkbox" class="checkbox checkbox--right" value="1" name="allowPublicUpload" id="sharingDialogAllowPublicUpload"' +
							((allowPublicUploadStatus) ? 'checked="checked"' : '') + ' />';
						html += '<label for="sharingDialogAllowPublicUpload">' +
						t('gallery', 'Allow editing') + '</label>';
						html += '</div>';
					}

					var mailPublicNotificationEnabled = $('input:hidden[name=mailPublicNotificationEnabled]').val();
					if (mailPublicNotificationEnabled === 'yes') {
						html += '<form id="emailPrivateLink">';
						html +=
							'<input id="email" style="display:none; width:62%;" value="" placeholder="' +
							t('gallery', 'Email link to person') + '" type="text" />';
						html +=
							'<input id="emailButton" style="display:none;" type="submit" value="' +
							t('gallery', 'Send') + '" />';
						html += '</form>';
					}
				}

				html += '<div id="expiration">';
				html +=
					'<input type="checkbox" class="checkbox checkbox--right" ' +
					'name="expirationCheckbox" id="expirationCheckbox" value="1" />' +
					'<label for="expirationCheckbox">' +
					t('gallery', 'Set expiration date') + '</label>';
				html += '<label for="expirationDate" class="hidden-visually">' +
					t('gallery', 'Expiration') + '</label>';
				html += '<input id="expirationDate" type="text" placeholder="' +
					t('gallery', 'Expiration date') + '" style="display:none; width:90%;" />';
				html += '<em id="defaultExpireMessage">' + defaultExpireMessage + '</em>';
				html += '</div>';
				dropDownEl = $(html);
				dropDownEl = dropDownEl.appendTo(appendTo);

				// trigger remote share info tooltip
				if (oc_appconfig.core.remoteShareAllowed) {
					$('.shareWithRemoteInfo').tooltip({placement: 'bottom'});
				}

				//Get owner avatars
				if (oc_config.enable_avatars === true && data !== false && data[0] !== false &&
					!_.isUndefined(data[0]) && !_.isUndefined(data[0].uid_file_owner)) {
					dropDownEl.find(".avatar").avatar(data[0].uid_file_owner, 32);
				}

				// Reset item shares
				this.itemShares = [];
				this.currentShares = {};
				if (data) {
					$.each(data, function (index, share) {
						if (share.share_type === self.SHARE_TYPE_LINK) {
							self.showLink(share.id, share.token, share.share_with);
						} else {
							if (share.share_with !== OC.currentUser) {
								if (share.share_type === self.SHARE_TYPE_REMOTE) {
									self._addShareWith(share.id,
										share.share_type,
										share.share_with,
										share.share_with_displayname,
										share.permissions,
										OC.PERMISSION_READ | OC.PERMISSION_UPDATE |
										OC.PERMISSION_CREATE,
										share.mail_send,
										false);
								} else {
									self._addShareWith(share.id,
										share.share_type,
										share.share_with,
										share.share_with_displayname,
										share.permissions,
										possiblePermissions,
										share.mail_send,
										false);
								}
							}
						}
						if (share.expiration != null) {
							var expireDate = moment(share.expiration, 'YYYY-MM-DD').format(
								'DD-MM-YYYY');
							self.showExpirationDate(expireDate, share.stime);
						}
					});
				}
				$('#shareWith').autocomplete({
					minLength: 2,
					delay: 750,
					source: function (search, response) {
						var $loading = $('#dropdown .shareWithLoading');
						var $remoteInfo = $('#dropdown .shareWithRemoteInfo');
						$loading.removeClass('hidden');
						$remoteInfo.addClass('hidden');
						$.get(OC.linkToOCS('apps/files_sharing/api/v1') + 'sharees', {
							format: 'json',
							search: search.term.trim(),
							perPage: 200,
							itemType: itemType
						}, function (result) {
							$loading.addClass('hidden');
							$remoteInfo.removeClass('hidden');
							if (result.ocs.meta.statuscode === 100) {
								var users = result.ocs.data.exact.users.concat(result.ocs.data.users);
								var groups = result.ocs.data.exact.groups.concat(result.ocs.data.groups);
								var remotes = result.ocs.data.exact.remotes.concat(result.ocs.data.remotes);
								var lookup = result.ocs.data.lookup;
								var emails = [],
									circles = [];
								if (typeof(result.ocs.data.emails) !== 'undefined') {
									emails = result.ocs.data.exact.emails.concat(result.ocs.data.emails);
								}
								if (typeof(result.ocs.data.circles) !== 'undefined') {
									circles = result.ocs.data.exact.circles.concat(result.ocs.data.circles);
								}

								var usersLength;
								var groupsLength;
								var remotesLength;
								var emailsLength;
								var circlesLength;

								var i, j;

								//Filter out the current user
								usersLength = users.length;
								for (i = 0; i < usersLength; i++) {
									if (users[i].value.shareWith === OC.currentUser) {
										users.splice(i, 1);
										break;
									}
								}

								var suggestions = users.concat(groups).concat(remotes).concat(emails).concat(circles).concat(lookup);

								if (suggestions.length > 0) {
									$('#shareWith')
										.autocomplete("option", "autoFocus", true);

									response(suggestions);

									// show a notice that the list is truncated
									// this is the case if one of the search results is at least as long as the max result config option
									if (oc_config['sharing.maxAutocompleteResults'] > 0 &&
										Math.min(perPage, oc_config['sharing.maxAutocompleteResults'])
										<= Math.max(users.length, groups.length, remotes.length, emails.length, lookup.length)) {

										var message = t('gallery', 'This list is maybe truncated - please refine your search term to see more results.');
										$('.ui-autocomplete').append('<li class="autocomplete-note">' + message + '</li>');
									}

								} else {
									var title = t('gallery', 'No users or groups found for {search}', {search: $('#shareWith').val()});
									if (!view.configModel.get('allowGroupSharing')) {
										title = t('gallery', 'No users found for {search}', {search: $('#shareWith').val()});
									}
									$('#shareWith').addClass('error')
										.attr('data-original-title', title)
										.tooltip('hide')
										.tooltip({
											placement: 'bottom',
											trigger: 'manual'
										})
										.tooltip('fixTitle')
										.tooltip('show');
									response();
								}
							} else {
								response();
							}
						}).fail(function () {
							$('#dropdown').find('.shareWithLoading').addClass('hidden');
							$('#dropdown').find('.shareWithRemoteInfo').removeClass('hidden');
							OC.Notification.show(t('gallery', 'An error occured. Please try again'));
							window.setTimeout(OC.Notification.hide, 5000);
						});
					},
					focus: function (event) {
						event.preventDefault();
					},
					select: function (event, selected) {
						event.stopPropagation();
						var $dropDown = $('#dropdown');
						var itemSource = $dropDown.data('item-source');
						var expirationDate = '';
						if ($('#expirationCheckbox').is(':checked') === true) {
							expirationDate = $("#expirationDate").val();
						}
						var shareType = selected.item.value.shareType;
						var shareWith = selected.item.value.shareWith;
						$(this).val(shareWith);
						// Default permissions are Edit (CRUD) and Share
						// Check if these permissions are possible
						var permissions = OC.PERMISSION_READ;
						if (shareType === Gallery.Share.SHARE_TYPE_REMOTE) {
							permissions =
								OC.PERMISSION_CREATE | OC.PERMISSION_UPDATE | OC.PERMISSION_READ;
						} else {
							if (possiblePermissions & OC.PERMISSION_UPDATE) {
								permissions = permissions | OC.PERMISSION_UPDATE;
							}
							if (possiblePermissions & OC.PERMISSION_CREATE) {
								permissions = permissions | OC.PERMISSION_CREATE;
							}
							if (possiblePermissions & OC.PERMISSION_DELETE) {
								permissions = permissions | OC.PERMISSION_DELETE;
							}
							if (oc_appconfig.core.resharingAllowed &&
								(possiblePermissions & OC.PERMISSION_SHARE)) {
								permissions = permissions | OC.PERMISSION_SHARE;
							}
						}

						var $input = $(this);
						var $loading = $dropDown.find('.shareWithLoading');
						var $remoteInfo = $dropDown.find('.shareWithRemoteInfo');
						$loading.removeClass('hidden');
						$remoteInfo.addClass('hidden');
						$input.val(t('gallery', 'Adding user...'));
						$input.prop('disabled', true);
						Gallery.Share.share(
							itemSource,
							shareType,
							shareWith,
							0,
							null,
							permissions,
							function (data) {
								var posPermissions = possiblePermissions;
								if (shareType === Gallery.Share.SHARE_TYPE_REMOTE) {
									posPermissions = permissions;
								}
								Gallery.Share._addShareWith(data.id, shareType, shareWith,
									selected.item.label,
									permissions, posPermissions);
							});
						$input.prop('disabled', false);
						$loading.addClass('hidden');
						$remoteInfo.removeClass('hidden');
						$('#shareWith').val('');
						return false;
					}
				}).data("ui-autocomplete")._renderItem = function (ul, item) {
					// customize internal _renderItem function to display groups and users
					// differently
					var insert = $("<a>");
					var text = item.label;
					if (item.value.shareType === Gallery.Share.SHARE_TYPE_GROUP) {
						text = text + ' (' + t('gallery', 'group') + ')';
					} else if (item.value.shareType === Gallery.Share.SHARE_TYPE_REMOTE) {
						text = text + ' (' + t('gallery', 'remote') + ')';
					}
					insert.text(text);
					if (item.value.shareType === Gallery.Share.SHARE_TYPE_GROUP) {
						insert = insert.wrapInner('<strong></strong>');
					}
					return $("<li>")
						.addClass(
							(item.value.shareType ===
							Gallery.Share.SHARE_TYPE_GROUP) ? 'group' : 'user')
						.append(insert)
						.appendTo(ul);
				};

				if (link && linksAllowed && $('#email').length != 0) {
					$('#email').autocomplete({
						minLength: 1,
						source: function (search, response) {
							$.get(OC.filePath('core', 'ajax', 'share.php'), {
								fetch: 'getShareWithEmail',
								search: search.term
							}, function (result) {
								if (result.status == 'success' && result.data.length > 0) {
									response(result.data);
								}
							});
						},
						select: function (event, item) {
							$('#email').val(item.item.email);
							return false;
						}
					})
						.data("ui-autocomplete")._renderItem = function (ul, item) {
						return $('<li>')
							.append('<a>' + escapeHTML(item.displayname) + "<br>" +
							escapeHTML(item.email) + '</a>')
							.appendTo(ul);
					};
				}

			} else {
				html += '<input id="shareWith" type="text" placeholder="' +
					t('gallery', 'Resharing is not allowed') +
					'" style="width:90%;" disabled="disabled"/>';
				html += '</div>';
				dropDownEl = $(html);
				dropDownEl.appendTo(appendTo);
			}
			dropDownEl.attr('data-item-source-name', filename);
			$('#dropdown').slideDown(OC.menuSpeed, function () {
				Gallery.Share.droppedDown = true;
			});
			if ($('html').hasClass('lte9')) {
				$('#dropdown input[placeholder]').placeholder();
			}
			$('#shareWith').focus();
		},
		/**
		 *
		 * @param callback
		 */
		hideDropDown: function (callback) {
			this.currentShares = null;
			$('#dropdown').slideUp(OC.menuSpeed, function () {
				Gallery.Share.droppedDown = false;
				$('#dropdown').remove();
				if (typeof FileActions !== 'undefined') {
					$('tr').removeClass('mouseOver');
				}
				if (callback) {
					callback.call();
				}
			});
		},
		/**
		 *
		 * @param id
		 * @param token
		 * @param password
		 */
		showLink: function (id, token, password) {
			var $linkCheckbox = $('#linkCheckbox');
			this.itemShares[this.SHARE_TYPE_LINK] = true;
			$linkCheckbox.attr('checked', true);
			$linkCheckbox.attr('data-id', id);
			var $linkText = $('#linkText');

			var link = parent.location.protocol + '//' + location.host +
				OC.generateUrl('/apps/gallery/s/') + token;

			$linkText.val(link);
			$linkText.slideDown(OC.menuSpeed);
			$linkText.css('display', 'block');
			if (oc_appconfig.core.enforcePasswordForPublicLink === false || password === null) {
				$('#showPassword+label').show();
			}
			if (password != null) {
				$('#linkPass').slideDown(OC.menuSpeed);
				$('#showPassword').attr('checked', true);
				$('#linkPassText').attr('placeholder', '**********');
			}
			$('#expiration').show();
			$('#emailPrivateLink #email').show();
			$('#emailPrivateLink #emailButton').show();
			$('#allowPublicUploadWrapper').show();
			$('#linkTextMore').show();
			$('#linkSocial').hide();
			$('#linkSocial').html('');

			var ul = $('<ul/>');

			OC.Share.Social.Collection.each(function(model) {
				var url = model.get('url');
				url = url.replace('{{reference}}', link);

				var li = $('<li>' +
					'<a href="#" class="menuitem pop-up" data-url="' + url + '" data-window="'+model.get('newWindow')+'">' +
					'<span class="icon ' + model.get('iconClass') + '"></span>' +
					'<span>' + model.get('name') + '</span>' +
					'</a>');
				li.appendTo(ul);
			});
			ul.appendTo('#linkSocial');

			if (OC.Share.Social.Collection.length === 0) {
				$('#linkTextMore').hide();
				$linkText.addClass('no-menu-item');
			} else {
				$linkText.removeClass('no-menu-item');
			}
		},
		/**
		 *
		 */
		hideLink: function () {
			$('#linkText').slideUp(OC.menuSpeed);
			$('#defaultExpireMessage').hide();
			$('#showPassword+label').hide();
			$('#linkSocial').hide();
			$('#linkTextMore').hide();
			$('#linkPass').slideUp(OC.menuSpeed);
			$('#emailPrivateLink #email').hide();
			$('#emailPrivateLink #emailButton').hide();
			$('#allowPublicUploadWrapper').hide();
		},
		/**
		 * Displays the expiration date field
		 *
		 * @param {String} date current expiration date
		 * @param {Date|Number|String} [shareTime] share timestamp in seconds, defaults to now
		 */
		showExpirationDate: function (date, shareTime) {
			var $expirationDate = $('#expirationDate');
			var $expirationCheckbox = $('#expirationCheckbox');
			var now = new Date();
			// min date should always be the next day
			var minDate = new Date();
			minDate.setDate(minDate.getDate() + 1);
			var datePickerOptions = {
				minDate: minDate,
				maxDate: null
			};
			// TODO: hack: backend returns string instead of integer
			shareTime = this._parseTime(shareTime);
			if (_.isNumber(shareTime)) {
				shareTime = new Date(shareTime * 1000);
			}
			if (!shareTime) {
				shareTime = now;
			}
			$expirationCheckbox.attr('checked', true);
			$expirationDate.val(date);
			$expirationDate.slideDown(OC.menuSpeed);
			$expirationDate.css('display', 'block');
			$expirationDate.datepicker({
				dateFormat: 'dd-mm-yy'
			});
			if (oc_appconfig.core.defaultExpireDateEnforced) {
				$expirationCheckbox.attr('disabled', true);
				shareTime = OC.Util.stripTime(shareTime).getTime();
				// max date is share date + X days
				datePickerOptions.maxDate =
					new Date(shareTime + oc_appconfig.core.defaultExpireDate * 24 * 3600 * 1000);
			}
			if (oc_appconfig.core.defaultExpireDateEnabled) {
				$('#defaultExpireMessage').slideDown(OC.menuSpeed);
			}
			$.datepicker.setDefaults(datePickerOptions);
		},
		/**
		 * Get the default Expire date
		 *
		 * @return {String} The expire date
		 */
		getDefaultExpirationDate: function () {
			var expireDateString = '';
			if (oc_appconfig.core.defaultExpireDateEnabled) {
				var date = new Date().getTime();
				var expireAfterMs = oc_appconfig.core.defaultExpireDate * 24 * 60 * 60 * 1000;
				var expireDate = new Date(date + expireAfterMs);
				var month = expireDate.getMonth() + 1;
				var year = expireDate.getFullYear();
				var day = expireDate.getDate();
				expireDateString = year + "-" + month + '-' + day + ' 00:00:00';
			}
			return expireDateString;
		},
		/**
		 * Loads all shares associated with a path
		 *
		 * @param path
		 *
		 * @returns {Gallery.Share.Types.ShareInfo|Boolean}
		 * @private
		 */
		_loadShares: function (path) {
			var data = false;
			var url = OC.linkToOCS('apps/files_sharing/api/v1', 2) + 'shares' + '?format=json';
			$.ajax({
				url: url,
				type: 'GET',
				data: {
					path: path,
					shared_with_me: true
				},
				async: false
			}).done(function (result) {
				data = result.ocs.data;
				$.ajax({
					url: url,
					type: 'GET',
					data: {
						path: path,
						reshares: true
					},
					async: false
				}).done(function (result) {
					data = _.union(data, result.ocs.data);
				})

			});

			if (data === false) {
				OC.dialogs.alert(t('gallery', 'Error while retrieving shares'),
					t('gallery', 'Error'));
			}

			return data;
		},
		/**
		 *
		 * @param shareId
		 * @param shareType
		 * @param shareWith
		 * @param shareWithDisplayName
		 * @param permissions
		 * @param possiblePermissions
		 * @param mailSend
		 *
		 * @private
		 */
		_addShareWith: function (shareId, shareType, shareWith, shareWithDisplayName, permissions, possiblePermissions, mailSend) {
			var shareItem = {
				share_id: shareId,
				share_type: shareType,
				share_with: shareWith,
				share_with_displayname: shareWithDisplayName,
				permissions: permissions
			};
			if (shareType === this.SHARE_TYPE_GROUP) {
				shareWithDisplayName = shareWithDisplayName + " (" + t('gallery', 'group') + ')';
			}
			if (shareType === this.SHARE_TYPE_REMOTE) {
				shareWithDisplayName = shareWithDisplayName + " (" + t('gallery', 'remote') + ')';
			}
			if (!this.itemShares[shareType]) {
				this.itemShares[shareType] = [];
			}
			this.itemShares[shareType].push(shareWith);

			var editChecked = '',
				createChecked = '',
				updateChecked = '',
				deleteChecked = '',
				shareChecked = '';
			if (permissions & OC.PERMISSION_CREATE) {
				createChecked = 'checked="checked"';
				editChecked = 'checked="checked"';
			}
			if (permissions & OC.PERMISSION_UPDATE) {
				updateChecked = 'checked="checked"';
				editChecked = 'checked="checked"';
			}
			if (permissions & OC.PERMISSION_DELETE) {
				deleteChecked = 'checked="checked"';
				editChecked = 'checked="checked"';
			}
			if (permissions & OC.PERMISSION_SHARE) {
				shareChecked = 'checked="checked"';
			}
			var html = '<li style="clear: both;" ' +
				'data-id="' + escapeHTML(shareId) + '"' +
				'data-share-type="' + escapeHTML(shareType) + '"' +
				'data-share-with="' + escapeHTML(shareWith) + '"' +
				'title="' + escapeHTML(shareWith) + '">';
			var showCrudsButton;
			html +=
				'<a href="#" class="unshare"><img class="svg" alt="' + t('gallery', 'Unshare') +
				'" title="' + t('gallery', 'Unshare') + '" src="' +
				OC.imagePath('core', 'actions/delete') + '"/></a>';
			if (oc_config.enable_avatars === true) {
				html += '<div class="avatar"></div>';
			}
			html += '<span class="username">' + escapeHTML(shareWithDisplayName) + '</span>';
			var mailNotificationEnabled = $('input:hidden[name=mailNotificationEnabled]').val();
			if (mailNotificationEnabled === 'yes' &&
				shareType !== this.SHARE_TYPE_REMOTE) {
				var checked = '';
				if (mailSend === 1) {
					checked = 'checked';
				}
				html +=
					'<input id="mail-' + escapeHTML(shareWith) + '" type="checkbox" class="mailNotification checkbox checkbox--right" ' +
					'name="mailNotification" ' +
					checked + ' />';
				html +=
					'<label for="mail-' + escapeHTML(shareWith) + '">' + t('gallery', 'notify by email') + '</label>';
			}
			if (oc_appconfig.core.resharingAllowed &&
				(possiblePermissions & OC.PERMISSION_SHARE)) {
				html += '<input id="canShare-' + escapeHTML(shareWith) +
					'" type="checkbox" class="permissions checkbox checkbox--right" name="share" ' +
					shareChecked + ' data-permissions="' + OC.PERMISSION_SHARE + '" />';
				html += '<label for="canShare-' + escapeHTML(shareWith) + '">' +
					t('gallery', 'can share') + '</label>';
			}
			if (possiblePermissions & OC.PERMISSION_CREATE ||
				possiblePermissions & OC.PERMISSION_UPDATE ||
				possiblePermissions & OC.PERMISSION_DELETE) {
				html += '<input id="canEdit-' + escapeHTML(shareWith) +
					'" type="checkbox" class="permissions checkbox checkbox--right" name="edit" ' +
					editChecked + ' />';
				html += '<label for="canEdit-' + escapeHTML(shareWith) + '">' +
					t('gallery', 'can edit') + '</label>';
			}
			if (shareType !== this.SHARE_TYPE_REMOTE) {
				showCrudsButton = '<a href="#" class="showCruds"><img class="svg" alt="' +
					t('gallery', 'access control') + '" src="' +
					OC.imagePath('core', 'actions/triangle-s') + '"/></a>';
			}
			html += '<div class="cruds" style="display:none;">';
			if (possiblePermissions & OC.PERMISSION_CREATE) {
				html += '<input id="canCreate-' + escapeHTML(shareWith) +
					'" type="checkbox" class="permissions checkbox checkbox--right" name="create" ' +
					createChecked + ' data-permissions="' + OC.PERMISSION_CREATE + '"/>';
				html += '<label for="canCreate-' + escapeHTML(shareWith) + '">' +
					t('gallery', 'create') + '</label>';
			}
			if (possiblePermissions & OC.PERMISSION_UPDATE) {
				html += '<input id="canUpdate-' + escapeHTML(shareWith) +
					'" type="checkbox" class="permissions checkbox checkbox--right" name="update" ' +
					updateChecked + ' data-permissions="' + OC.PERMISSION_UPDATE + '"/>';
				html += '<label for="canUpdate-' + escapeHTML(shareWith) + '">' +
					t('gallery', 'change') + '</label>';
			}
			if (possiblePermissions & OC.PERMISSION_DELETE) {
				html += '<input id="canDelete-' + escapeHTML(shareWith) +
					'" type="checkbox" class="permissions checkbox checkbox--right" name="delete" ' +
					deleteChecked + ' data-permissions="' + OC.PERMISSION_DELETE + '"/>';
				html += '<label for="canDelete-' + escapeHTML(shareWith) + '">' +
					t('gallery', 'delete') + '</label>';
			}
			html += '</div>';
			html += '</li>';
			html = $(html).appendTo('#dropdown #shareWithList');
			if (oc_config.enable_avatars === true) {
				if (shareType === this.SHARE_TYPE_USER) {
					html.find('.avatar').avatar(escapeHTML(shareWith), 32);
				} else {
					//Add sharetype to generate different seed if there is a group and use with
					// the same name
					html.find('.avatar').imageplaceholder(
						escapeHTML(shareWith) + ' ' + shareType);
				}
			}
			// insert cruds button into last label element
			var lastLabel = html.find('>label:last');
			if (lastLabel.exists()) {
				lastLabel.append(showCrudsButton);
			}
			else {
				html.find('.cruds').before(showCrudsButton);
			}
			if (!this.currentShares[shareType]) {
				this.currentShares[shareType] = [];
			}
			this.currentShares[shareType].push(shareItem);
		},
		/**
		 * Parses a string to an valid integer (unix timestamp)
		 * @param time
		 * @returns {*}
		 * @internal Only used to work around a bug in the backend
		 * @private
		 */
		_parseTime: function (time) {
			if (_.isString(time)) {
				// skip empty strings and hex values
				if (time === '' || (time.length > 1 && time[0] === '0' && time[1] === 'x')) {
					return null;
				}
				time = parseInt(time, 10);
				if (isNaN(time)) {
					time = null;
				}
			}
			return time;
		}
	};

	Gallery.Share = Share;
})(jQuery, Gallery);

$(document).ready(function () {

	if (typeof monthNames != 'undefined') {
		// min date should always be the next day
		var minDate = new Date();
		minDate.setDate(minDate.getDate() + 1);
		$.datepicker.setDefaults({
			monthNames: monthNames,
			monthNamesShort: $.map(monthNames, function (v) {
				return v.slice(0, 3) + '.';
			}),
			dayNames: dayNames,
			dayNamesMin: $.map(dayNames, function (v) {
				return v.slice(0, 2);
			}),
			dayNamesShort: $.map(dayNames, function (v) {
				return v.slice(0, 3) + '.';
			}),
			firstDay: firstDay,
			minDate: minDate
		});
	}
	$(document).on('click', 'a.share', function (event) {
		event.stopPropagation();
		if ($(this).data('item-type') !== undefined && $(this).data('path') !== undefined) {
			var itemType = $(this).data('item-type');
			var path = $(this).data('path');
			var appendTo = $(this).parent().parent();
			var link = false;
			var possiblePermissions = $(this).data('possible-permissions');
			if ($(this).data('link') !== undefined && $(this).data('link') == true) {
				link = true;
			}
			if (Gallery.Share.droppedDown) {
				if (path != $('#dropdown').data('path')) {
					Gallery.Share.hideDropDown(function () {
						Gallery.Share.showDropDown(itemType, path, appendTo, link,
							possiblePermissions);
					});
				} else {
					Gallery.Share.hideDropDown();
				}
			} else {
				Gallery.Share.showDropDown(itemType, path, appendTo, link, possiblePermissions);
			}
		}
	});

	$(this).click(function (event) {
		var target = $(event.target);
		var isMatched = !target.is('.drop, .ui-datepicker-next, .ui-datepicker-prev, .ui-icon')
			&& !target.closest('#ui-datepicker-div').length &&
			!target.closest('.ui-autocomplete').length;
		if (Gallery.Share.droppedDown && isMatched &&
			$('#dropdown').has(event.target).length === 0) {
			Gallery.Share.hideDropDown();
		}
	});

	$(document).on('click', '#dropdown .showCruds', function () {
		$(this).closest('li').find('.cruds').toggle();
		return false;
	});

	$(document).on('click', '#dropdown .unshare', function () {
		var $li = $(this).closest('li');
		var shareType = $li.data('share-type');
		var shareWith = $li.attr('data-share-with');
		var shareId = $li.attr('data-id');
		var $button = $(this);

		if (!$button.is('a')) {
			$button = $button.closest('a');
		}

		if ($button.hasClass('icon-loading-small')) {
			// deletion in progress
			return false;
		}
		$button.empty().addClass('icon-loading-small');
		Gallery.Share.unshare(shareId, function () {
			$li.remove();
			var index = Gallery.Share.itemShares[shareType].indexOf(shareWith);
			Gallery.Share.itemShares[shareType].splice(index, 1);
			// updated list of shares
			Gallery.Share.currentShares[shareType].splice(index, 1);
		});

		return false;
	});

	$(document).on('change', '#dropdown .permissions', function () {
		var $li = $(this).closest('li');
		var checkboxes = $('.permissions', $li);
		if ($(this).attr('name') == 'edit') {
			var checked = $(this).is(':checked');
			// Check/uncheck Create, Update, and Delete checkboxes if Edit is checked/unck
			$(checkboxes).filter('input[name="create"]').attr('checked', checked);
			$(checkboxes).filter('input[name="update"]').attr('checked', checked);
			$(checkboxes).filter('input[name="delete"]').attr('checked', checked);
		} else {
			// Uncheck Edit if Create, Update, and Delete are not checked
			if (!$(this).is(':checked')
				&& !$(checkboxes).filter('input[name="create"]').is(':checked')
				&& !$(checkboxes).filter('input[name="update"]').is(':checked')
				&& !$(checkboxes).filter('input[name="delete"]').is(':checked')) {
				$(checkboxes).filter('input[name="edit"]').attr('checked', false);
				// Check Edit if Create, Update, or Delete is checked
			} else if (($(this).attr('name') == 'create'
				|| $(this).attr('name') == 'update'
				|| $(this).attr('name') == 'delete')) {
				$(checkboxes).filter('input[name="edit"]').attr('checked', true);
			}
		}
		var permissions = OC.PERMISSION_READ;
		$(checkboxes).filter(':not(input[name="edit"])').filter(':checked').each(
			function (index, checkbox) {
				permissions |= $(checkbox).data('permissions');
			});

		Gallery.Share.setPermissions($li.attr('data-id'), permissions);
	});

	$(document).on('change', '#dropdown #linkCheckbox', function () {
		var $dropDown = $('#dropdown');
		var path = $dropDown.data('item-source');
		var shareId = $('#linkCheckbox').data('id');
		var shareWith = '';
		var publicUpload = 0;
		var $loading = $dropDown.find('#link .icon-loading-small');
		var $button = $(this);

		if (!$loading.hasClass('hidden')) {
			// already in progress
			return false;
		}

		if (this.checked) {
			// Reset password placeholder
			$('#linkPassText').attr('placeholder',
				t('gallery', 'Choose a password for the public link'));
			// Reset link
			$('#linkText').val('');
			$('#showPassword').prop('checked', false);
			$('#linkPass').hide();
			$('#linkSocial').hide();
			$('#linkTextMore').hide();
			$('#sharingDialogAllowPublicUpload').prop('checked', false);
			$('#expirationCheckbox').prop('checked', false);
			$('#expirationDate').hide();
			var expireDateString = '';
			// Create a link
			if (oc_appconfig.core.enforcePasswordForPublicLink === false) {
				expireDateString = Gallery.Share.getDefaultExpirationDate();
				$loading.removeClass('hidden');
				$button.addClass('hidden');
				$button.prop('disabled', true);
				Gallery.Share.share(
					path,
					Gallery.Share.SHARE_TYPE_LINK,
					shareWith,
					publicUpload,
					null,
					OC.PERMISSION_READ,
					function (data) {
						$loading.addClass('hidden');
						$button.removeClass('hidden');
						$button.prop('disabled', false);
						Gallery.Share.showLink(data.id, data.token, null);
					});
			} else {
				$('#linkPass').slideToggle(OC.menuSpeed);
				$('#linkPassText').focus();
			}
			if (expireDateString !== '') {
				Gallery.Share.showExpirationDate(expireDateString);
			}
		} else {
			// Delete private link
			Gallery.Share.hideLink();
			$('#expiration').slideUp(OC.menuSpeed);
			if ($('#linkText').val() !== '') {
				$loading.removeClass('hidden');
				$button.addClass('hidden');
				$button.prop('disabled', true);
				Gallery.Share.unshare(shareId, function () {
					$loading.addClass('hidden');
					$button.removeClass('hidden');
					$button.prop('disabled', false);
					Gallery.Share.itemShares[Gallery.Share.SHARE_TYPE_LINK] = false;
				});
			}
		}
	});

	$(document).on('click', '#dropdown #linkText', function () {
		$(this).focus();
		$(this).select();
	});

	// Handle the Allow Public Upload Checkbox
	$(document).on('click', '#sharingDialogAllowPublicUpload', function () {

		// Gather data
		var $dropDown = $('#dropdown');
		var shareId = $('#linkCheckbox').data('id');
		var allowPublicUpload = $(this).is(':checked');
		var $button = $(this);
		var $loading = $dropDown.find('#allowPublicUploadWrapper .icon-loading-small');

		if (!$loading.hasClass('hidden')) {
			// already in progress
			return false;
		}

		// Update the share information
		$button.addClass('hidden');
		$button.prop('disabled', true);
		$loading.removeClass('hidden');
		//(path, shareType, shareWith, publicUpload, password, permissions)
		$.ajax({
			url: OC.linkToOCS('apps/files_sharing/api/v1', 2) + 'shares/' + shareId +
			'?format=json',
			type: 'PUT',
			data: {
				publicUpload: allowPublicUpload
			}
		}).done(function () {
			$loading.addClass('hidden');
			$button.removeClass('hidden');
			$button.prop('disabled', false);
		});
	});

	$(document).on('click', '#dropdown #showPassword', function () {
		$('#linkPass').slideToggle(OC.menuSpeed);
		if (!$('#showPassword').is(':checked')) {
			var shareId = $('#linkCheckbox').data('id');
			var $loading = $('#showPassword .icon-loading-small');

			$loading.removeClass('hidden');
			$.ajax({
				url: OC.linkToOCS('apps/files_sharing/api/v1', 2) + 'shares/' + shareId +
				'?format=json',
				type: 'PUT',
				data: {
					password: null
				}
			}).done(function () {
				$loading.addClass('hidden');
				$('#linkPassText').attr('placeholder',
					t('gallery', 'Choose a password for the public link'));
			});
		} else {
			$('#linkPassText').focus();
		}
	});

	$(document).on('focusout keyup', '#dropdown #linkPassText', function (event) {
		var linkPassText = $('#linkPassText');
		if (linkPassText.val() != '' && (event.type == 'focusout' || event.keyCode == 13)) {
			var dropDown = $('#dropdown');
			var $loading = dropDown.find('#linkPass .icon-loading-small');
			var shareId = $('#linkCheckbox').data('id');

			$loading.removeClass('hidden');
			$.ajax({
				url: OC.linkToOCS('apps/files_sharing/api/v1', 2) + 'shares/' + shareId +
				'?format=json',
				type: 'PUT',
				data: {
					password: $('#linkPassText').val()
				}
			}).done(function (data) {
				$loading.addClass('hidden');
				linkPassText.val('');
				linkPassText.attr('placeholder', t('gallery', 'Password protected'));

				if (oc_appconfig.core.enforcePasswordForPublicLink) {
					Gallery.Share.showLink(data.id, data.token, "password set");
				}
			}).fail(function (xhr) {
				var result = xhr.responseJSON;
				$loading.addClass('hidden');
				linkPassText.val('');
				linkPassText.attr('placeholder', result.data.message);
			});
		}
	});

	$(document).on('click', '#dropdown #expirationCheckbox', function () {
		if (this.checked) {
			Gallery.Share.showExpirationDate('');
		} else {
			var shareId = $('#linkCheckbox').data('id');
			$.ajax({
				url: OC.linkToOCS('apps/files_sharing/api/v1', 2) + 'shares/' + shareId +
				'?format=json',
				type: 'PUT',
				data: {
					expireDate: ''
				}
			}).done(function () {
				$('#expirationDate').slideUp(OC.menuSpeed);
				if (oc_appconfig.core.defaultExpireDateEnforced === false) {
					$('#defaultExpireMessage').slideDown(OC.menuSpeed);
				}
			}).fail(function () {
				OC.dialogs.alert(t('gallery', 'Error unsetting expiration date'),
					t('gallery', 'Error'));
			});
		}
	});

	$(document).on('change', '#dropdown #expirationDate', function () {
		var shareId = $('#linkCheckbox').data('id');

		$(this).tooltip('hide');
		$(this).removeClass('error');

		$.ajax({
			url: OC.linkToOCS('apps/files_sharing/api/v1', 2) + 'shares/' + shareId +
			'?format=json',
			type: 'PUT',
			data: {
				expireDate: $(this).val()
			}
		}).done(function () {
			if (oc_appconfig.core.defaultExpireDateEnforced === 'no') {
				$('#defaultExpireMessage').slideUp(OC.menuSpeed);
			}
		}).fail(function (xhr) {
			var result = xhr.responseJSON;
			var expirationDateField = $('#dropdown #expirationDate');
			if (result && !result.ocs.meta.message) {
				expirationDateField.attr('original-title',
					t('gallery', 'Error setting expiration date'));
			} else {
				expirationDateField.attr('original-title', result.ocs.meta.message);
			}
			expirationDateField.tooltip({placement: 'top'});
			expirationDateField.tooltip('show');
			expirationDateField.addClass('error');
		});
	});


	$(document).on('submit', '#dropdown #emailPrivateLink', function (event) {
		event.preventDefault();
		var link = $('#linkText').val();
		var itemType = $('#dropdown').data('item-type');
		var itemSource = $('#dropdown').data('item-source');
		var fileName = $('.last').children()[0].innerText;
		var email = $('#email').val();
		var expirationDate = '';
		if ($('#expirationCheckbox').is(':checked') === true) {
			expirationDate = $("#expirationDate").val();
		}
		if (email != '') {
			$('#email').prop('disabled', true);
			$('#email').val(t('gallery', 'Sending ...'));
			$('#emailButton').prop('disabled', true);

			$.post(OC.filePath('core', 'ajax', 'share.php'), {
					action: 'email',
					toaddress: email,
					link: link,
					file: fileName,
					itemType: itemType,
					itemSource: itemSource,
					expiration: expirationDate
				},
				function (result) {
					$('#email').prop('disabled', false);
					$('#emailButton').prop('disabled', false);
					if (result && result.status == 'success') {
						$('#email').css('font-weight', 'bold').val(t('gallery', 'Email sent'));
						setTimeout(function () {
							$('#email').css('font-weight', 'normal').val('');
						}, 2000);
					} else {
						OC.dialogs.alert(result.data.message, t('gallery', 'Error while sharing'));
					}
				});
		}
	});

	$(document).on('click', '#dropdown input[name=mailNotification]', function () {
		var $li = $(this).closest('li');
		var itemType = $('#dropdown').data('item-type');
		var itemSource = $('a.share').data('item-source');
		var action = '';
		if (this.checked) {
			action = 'informRecipients';
		} else {
			action = 'informRecipientsDisabled';
		}
		var shareType = $li.data('share-type');
		var shareWith = $li.attr('data-share-with');
		$.post(OC.filePath('core', 'ajax', 'share.php'), {
			action: action,
			recipient: shareWith,
			shareType: shareType,
			itemSource: itemSource,
			itemType: itemType
		}, function (result) {
			if (result.status !== 'success') {
				OC.dialogs.alert(t('gallery', result.data.message), t('gallery', 'Warning'));
			}
		});
	});

	$(document).on('click', '#dropdown .pop-up', function(event) {
		event.preventDefault();
		event.stopPropagation();

		var url = $(event.currentTarget).data('url');
		var newWindow = $(event.currentTarget).data('window');
		$(event.currentTarget).tooltip('hide');
		if (url) {
			if (newWindow === true) {
				var width = 600;
				var height = 400;
				var left = (screen.width / 2) - (width / 2);
				var top = (screen.height / 2) - (height / 2);

				window.open(url, 'name', 'width=' + width + ', height=' + height + ', top=' + top + ', left=' + left);
			} else {
				window.location.href = url;
			}
		}
	});

	$(document).on('click', '#dropdown .icon-more', function(event) {
		event.preventDefault();
		event.stopPropagation();

		var children = event.currentTarget.parentNode.children;

		$.each(children, function (key, value) {
			if (value.classList.contains('popovermenu')) {
				$(value).toggle();
			}
		});
	});
});


