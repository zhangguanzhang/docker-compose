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
/* global OC, $, _, Gallery, SlideShow */
$(document).ready(function () {
	"use strict";
	$('#controls').insertBefore($('#content-wrapper'));
	Gallery.utility = new Gallery.Utility();
	Gallery.view = new Gallery.View();
	Gallery.token = Gallery.utility.getPublicToken();
	Gallery.ieVersion = Gallery.utility.getIeVersion();
	Gallery.filesClient = new OC.Files.Client({
		host: Gallery.utility.getWebdavHost(),
		port: OC.getPort(),
		root: Gallery.utility.getWebdavRoot(),
		useHTTPS: OC.getProtocol() === 'https'
	});

	// The first thing to do is to detect if we're on IE
	if (Gallery.ieVersion === 'unsupportedIe') {
		Gallery.utility.showIeWarning(Gallery.ieVersion);
		Gallery.view.showEmptyFolder('', null);
	} else {
		if (Gallery.ieVersion === 'oldIe') {
			Gallery.utility.showIeWarning(Gallery.ieVersion);
		}

		// Get the config, the files and initialise the slideshow
		Gallery.view.showLoading();
		$.getJSON(Gallery.utility.buildGalleryUrl('config', '', {}))
			.then(function (config) {
				Gallery.config = new Gallery.Config(config);
				var currentLocation = window.location.href.split('#')[1] || '';
				Gallery.activeSlideShow = new SlideShow();
				$.when(
					Gallery.activeSlideShow.init(
						false,
						null,
						Gallery.config.galleryFeatures
					))
					.then(function () {
						Gallery.getFiles(currentLocation).then(function () {
							window.onhashchange();
						});
					});
			});

		$(document).click(function () {
			$('.album-info-container').slideUp();
		});

		// This block loads new rows
		$('html, #content-wrapper').scroll(function () {
			Gallery.view.loadVisibleRows(Gallery.albumMap[Gallery.currentAlbum]);
		});


		var windowWidth = $(window).width();
		var windowHeight = $(window).height();
		$(window).resize(_.throttle(function () {
			var infoContentContainer = $('.album-info-container');
			// This section redraws the photowall and limits the width of dropdowns
			if (windowWidth !== $(window).width()) {
				if ($('#emptycontent').is(':hidden')) {
					Gallery.view.viewAlbum(Gallery.currentAlbum);
					infoContentContainer.css('max-width', $(window).width());
				}
				if (Gallery.currentAlbum) {
					Gallery.view.breadcrumb.setMaxWidth($(window).width() - Gallery.buttonsWidth);
				}

				windowWidth = $(window).width();
			}
			// This makes sure dropdowns will not be hidden after a window resize
			if (windowHeight !== $(window).height()) {
				infoContentContainer.css('max-height',
					$(window).height() - Gallery.browserToolbarHeight);

				windowHeight = $(window).height();
			}
		}, 250)); // A shorter delay avoids redrawing the view in the middle of a previous request,
				  // but it may kill baby CPUs
	}
});

/**
 * Responsible to refresh the view when we detect a change of location via the browser URL
 */
window.onhashchange = function () {
	"use strict";
	Gallery.view.dimControls();
	var currentLocation = window.location.href.split('#')[1] || '';
	// The hash location is ALWAYS encoded, despite what the browser shows
	var path = decodeURIComponent(currentLocation);

	// This section tries to determine if the hash location points to a file or a folder
	var albumPath = OC.dirname(path);
	if (Gallery.albumMap[path]) {
		albumPath = path;
	} else if (!Gallery.albumMap[albumPath]) {
		albumPath = '';
	}
	// We need to get new files if we've assessed that we've changed folder
	if (Gallery.currentAlbum !== null && Gallery.currentAlbum !== albumPath) {
		Gallery.getFiles(currentLocation).done(function () {
			Gallery.refresh(path, albumPath);
		});
	} else {
		// When the gallery is first loaded, the files have already been fetched
		Gallery.refresh(path, albumPath);
	}
};


/*!
 * jQuery Mobile Events
 * by Ben Major
 *
 * Copyright 2011-2017, Ben Major
 * Licensed under the MIT License:
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 * 
 */
"use strict";!function(a){function n(){var a=f();a!==g&&(g=a,d.trigger("orientationchange"))}function u(b,c,d,e){var f=d.type;d.type=c,a.event.dispatch.call(b,d,e),d.type=f}a.attrFn=a.attrFn||{};var b="ontouchstart"in window,c={tap_pixel_range:5,swipe_h_threshold:50,swipe_v_threshold:50,taphold_threshold:750,doubletap_int:500,touch_capable:b,orientation_support:"orientation"in window&&"onorientationchange"in window,startevent:b?"touchstart":"mousedown",endevent:b?"touchend":"mouseup",moveevent:b?"touchmove":"mousemove",tapevent:b?"tap":"click",scrollevent:b?"touchmove":"scroll",hold_timer:null,tap_timer:null};a.isTouchCapable=function(){return c.touch_capable},a.getStartEvent=function(){return c.startevent},a.getEndEvent=function(){return c.endevent},a.getMoveEvent=function(){return c.moveevent},a.getTapEvent=function(){return c.tapevent},a.getScrollEvent=function(){return c.scrollevent},a.each(["tapstart","tapend","tapmove","tap","tap2","tap3","tap4","singletap","doubletap","taphold","swipe","swipeup","swiperight","swipedown","swipeleft","swipeend","scrollstart","scrollend","orientationchange"],function(b,c){a.fn[c]=function(a){return a?this.on(c,a):this.trigger(c)},a.attrFn[c]=!0}),a.event.special.tapstart={setup:function(){var b=this,d=a(b);d.on(c.startevent,function a(e){if(d.data("callee",a),e.which&&1!==e.which)return!1;var f=e.originalEvent,g={position:{x:c.touch_capable?f.touches[0].screenX:e.screenX,y:c.touch_capable?f.touches[0].screenY:e.screenY},offset:{x:c.touch_capable?Math.round(f.changedTouches[0].pageX-(d.offset()?d.offset().left:0)):Math.round(e.pageX-(d.offset()?d.offset().left:0)),y:c.touch_capable?Math.round(f.changedTouches[0].pageY-(d.offset()?d.offset().top:0)):Math.round(e.pageY-(d.offset()?d.offset().top:0))},time:Date.now(),target:e.target};return u(b,"tapstart",e,g),!0})},remove:function(){a(this).off(c.startevent,a(this).data.callee)}},a.event.special.tapmove={setup:function(){var b=this,d=a(b);d.on(c.moveevent,function a(e){d.data("callee",a);var f=e.originalEvent,g={position:{x:c.touch_capable?f.touches[0].screenX:e.screenX,y:c.touch_capable?f.touches[0].screenY:e.screenY},offset:{x:c.touch_capable?Math.round(f.changedTouches[0].pageX-(d.offset()?d.offset().left:0)):Math.round(e.pageX-(d.offset()?d.offset().left:0)),y:c.touch_capable?Math.round(f.changedTouches[0].pageY-(d.offset()?d.offset().top:0)):Math.round(e.pageY-(d.offset()?d.offset().top:0))},time:Date.now(),target:e.target};return u(b,"tapmove",e,g),!0})},remove:function(){a(this).off(c.moveevent,a(this).data.callee)}},a.event.special.tapend={setup:function(){var b=this,d=a(b);d.on(c.endevent,function a(e){d.data("callee",a);var f=e.originalEvent,g={position:{x:c.touch_capable?f.changedTouches[0].screenX:e.screenX,y:c.touch_capable?f.changedTouches[0].screenY:e.screenY},offset:{x:c.touch_capable?Math.round(f.changedTouches[0].pageX-(d.offset()?d.offset().left:0)):Math.round(e.pageX-(d.offset()?d.offset().left:0)),y:c.touch_capable?Math.round(f.changedTouches[0].pageY-(d.offset()?d.offset().top:0)):Math.round(e.pageY-(d.offset()?d.offset().top:0))},time:Date.now(),target:e.target};return u(b,"tapend",e,g),!0})},remove:function(){a(this).off(c.endevent,a(this).data.callee)}},a.event.special.taphold={setup:function(){var e,b=this,d=a(b),f={x:0,y:0},g=0,h=0;d.on(c.startevent,function a(i){if(i.which&&1!==i.which)return!1;d.data("tapheld",!1),e=i.target;var j=i.originalEvent,k=Date.now(),l={x:c.touch_capable?j.touches[0].screenX:i.screenX,y:c.touch_capable?j.touches[0].screenY:i.screenY},m={x:c.touch_capable?j.touches[0].pageX-j.touches[0].target.offsetLeft:i.offsetX,y:c.touch_capable?j.touches[0].pageY-j.touches[0].target.offsetTop:i.offsetY};f.x=i.originalEvent.targetTouches?i.originalEvent.targetTouches[0].pageX:i.pageX,f.y=i.originalEvent.targetTouches?i.originalEvent.targetTouches[0].pageY:i.pageY,g=f.x,h=f.y;var n=d.parent().data("threshold")?d.parent().data("threshold"):d.data("threshold"),o="undefined"!=typeof n&&n!==!1&&parseInt(n)?parseInt(n):c.taphold_threshold;return c.hold_timer=window.setTimeout(function(){var n=f.x-g,o=f.y-h;if(i.target==e&&(f.x==g&&f.y==h||n>=-c.tap_pixel_range&&n<=c.tap_pixel_range&&o>=-c.tap_pixel_range&&o<=c.tap_pixel_range)){d.data("tapheld",!0);var p=Date.now(),q={x:c.touch_capable?j.touches[0].screenX:i.screenX,y:c.touch_capable?j.touches[0].screenY:i.screenY},r={x:c.touch_capable?Math.round(j.changedTouches[0].pageX-(d.offset()?d.offset().left:0)):Math.round(i.pageX-(d.offset()?d.offset().left:0)),y:c.touch_capable?Math.round(j.changedTouches[0].pageY-(d.offset()?d.offset().top:0)):Math.round(i.pageY-(d.offset()?d.offset().top:0))},s=p-k,t={startTime:k,endTime:p,startPosition:l,startOffset:m,endPosition:q,endOffset:r,duration:s,target:i.target};d.data("callee1",a),u(b,"taphold",i,t)}},o),!0}).on(c.endevent,function a(){d.data("callee2",a),d.data("tapheld",!1),window.clearTimeout(c.hold_timer)}).on(c.moveevent,function a(b){d.data("callee3",a),g=b.originalEvent.targetTouches?b.originalEvent.targetTouches[0].pageX:b.pageX,h=b.originalEvent.targetTouches?b.originalEvent.targetTouches[0].pageY:b.pageY})},remove:function(){a(this).off(c.startevent,a(this).data.callee1).off(c.endevent,a(this).data.callee2).off(c.moveevent,a(this).data.callee3)}},a.event.special.doubletap={setup:function(){var e,f,h,i,b=this,d=a(b),g=null,j=!1;d.on(c.startevent,function a(b){return(!b.which||1===b.which)&&(d.data("doubletapped",!1),e=b.target,d.data("callee1",a),h=b.originalEvent,g||(g={position:{x:c.touch_capable?h.touches[0].screenX:b.screenX,y:c.touch_capable?h.touches[0].screenY:b.screenY},offset:{x:c.touch_capable?Math.round(h.changedTouches[0].pageX-(d.offset()?d.offset().left:0)):Math.round(b.pageX-(d.offset()?d.offset().left:0)),y:c.touch_capable?Math.round(h.changedTouches[0].pageY-(d.offset()?d.offset().top:0)):Math.round(b.pageY-(d.offset()?d.offset().top:0))},time:Date.now(),target:b.target}),!0)}).on(c.endevent,function a(k){var l=Date.now(),m=d.data("lastTouch")||l+1,n=l-m;if(window.clearTimeout(f),d.data("callee2",a),n<c.doubletap_int&&k.target==e&&n>100){d.data("doubletapped",!0),window.clearTimeout(c.tap_timer);var o={position:{x:c.touch_capable?k.originalEvent.changedTouches[0].screenX:k.screenX,y:c.touch_capable?k.originalEvent.changedTouches[0].screenY:k.screenY},offset:{x:c.touch_capable?Math.round(h.changedTouches[0].pageX-(d.offset()?d.offset().left:0)):Math.round(k.pageX-(d.offset()?d.offset().left:0)),y:c.touch_capable?Math.round(h.changedTouches[0].pageY-(d.offset()?d.offset().top:0)):Math.round(k.pageY-(d.offset()?d.offset().top:0))},time:Date.now(),target:k.target},p={firstTap:g,secondTap:o,interval:o.time-g.time};j||(u(b,"doubletap",k,p),g=null),j=!0,i=window.setTimeout(function(){j=!1},c.doubletap_int)}else d.data("lastTouch",l),f=window.setTimeout(function(){g=null,window.clearTimeout(f)},c.doubletap_int,[k]);d.data("lastTouch",l)})},remove:function(){a(this).off(c.startevent,a(this).data.callee1).off(c.endevent,a(this).data.callee2)}},a.event.special.singletap={setup:function(){var b=this,d=a(b),e=null,f=null,g={x:0,y:0};d.on(c.startevent,function a(b){return(!b.which||1===b.which)&&(f=Date.now(),e=b.target,d.data("callee1",a),g.x=b.originalEvent.targetTouches?b.originalEvent.targetTouches[0].pageX:b.pageX,g.y=b.originalEvent.targetTouches?b.originalEvent.targetTouches[0].pageY:b.pageY,!0)}).on(c.endevent,function a(h){if(d.data("callee2",a),h.target==e){var i=h.originalEvent.changedTouches?h.originalEvent.changedTouches[0].pageX:h.pageX,j=h.originalEvent.changedTouches?h.originalEvent.changedTouches[0].pageY:h.pageY;c.tap_timer=window.setTimeout(function(){var a=g.x-i,e=g.y-j;if(!d.data("doubletapped")&&!d.data("tapheld")&&(g.x==i&&g.y==j||a>=-c.tap_pixel_range&&a<=c.tap_pixel_range&&e>=-c.tap_pixel_range&&e<=c.tap_pixel_range)){var k=h.originalEvent,l={position:{x:c.touch_capable?k.changedTouches[0].screenX:h.screenX,y:c.touch_capable?k.changedTouches[0].screenY:h.screenY},offset:{x:c.touch_capable?Math.round(k.changedTouches[0].pageX-(d.offset()?d.offset().left:0)):Math.round(h.pageX-(d.offset()?d.offset().left:0)),y:c.touch_capable?Math.round(k.changedTouches[0].pageY-(d.offset()?d.offset().top:0)):Math.round(h.pageY-(d.offset()?d.offset().top:0))},time:Date.now(),target:h.target};l.time-f<c.taphold_threshold&&u(b,"singletap",h,l)}},c.doubletap_int)}})},remove:function(){a(this).off(c.startevent,a(this).data.callee1).off(c.endevent,a(this).data.callee2)}},a.event.special.tap={setup:function(){var g,i,b=this,d=a(b),e=!1,f=null,h={x:0,y:0};d.on(c.startevent,function a(b){return d.data("callee1",a),(!b.which||1===b.which)&&(e=!0,h.x=b.originalEvent.targetTouches?b.originalEvent.targetTouches[0].pageX:b.pageX,h.y=b.originalEvent.targetTouches?b.originalEvent.targetTouches[0].pageY:b.pageY,g=Date.now(),f=b.target,i=b.originalEvent.targetTouches?b.originalEvent.targetTouches:[b],!0)}).on(c.endevent,function a(j){d.data("callee2",a);var k=j.originalEvent.targetTouches?j.originalEvent.changedTouches[0].pageX:j.pageX,l=j.originalEvent.targetTouches?j.originalEvent.changedTouches[0].pageY:j.pageY,m=h.x-k,n=h.y-l;if(f==j.target&&e&&Date.now()-g<c.taphold_threshold&&(h.x==k&&h.y==l||m>=-c.tap_pixel_range&&m<=c.tap_pixel_range&&n>=-c.tap_pixel_range&&n<=c.tap_pixel_range)){for(var p=j.originalEvent,q=[],r=0;r<i.length;r++){var s={position:{x:c.touch_capable?p.changedTouches[r].screenX:j.screenX,y:c.touch_capable?p.changedTouches[r].screenY:j.screenY},offset:{x:c.touch_capable?Math.round(p.changedTouches[r].pageX-(d.offset()?d.offset().left:0)):Math.round(j.pageX-(d.offset()?d.offset().left:0)),y:c.touch_capable?Math.round(p.changedTouches[r].pageY-(d.offset()?d.offset().top:0)):Math.round(j.pageY-(d.offset()?d.offset().top:0))},time:Date.now(),target:j.target};q.push(s)}u(b,"tap",j,q)}})},remove:function(){a(this).off(c.startevent,a(this).data.callee1).off(c.endevent,a(this).data.callee2)}},a.event.special.swipe={setup:function(){function j(b){d=a(b.currentTarget),d.data("callee1",j),g.x=b.originalEvent.targetTouches?b.originalEvent.targetTouches[0].pageX:b.pageX,g.y=b.originalEvent.targetTouches?b.originalEvent.targetTouches[0].pageY:b.pageY,h.x=g.x,h.y=g.y,e=!0;var f=b.originalEvent;i={position:{x:c.touch_capable?f.touches[0].screenX:b.screenX,y:c.touch_capable?f.touches[0].screenY:b.screenY},offset:{x:c.touch_capable?Math.round(f.changedTouches[0].pageX-(d.offset()?d.offset().left:0)):Math.round(b.pageX-(d.offset()?d.offset().left:0)),y:c.touch_capable?Math.round(f.changedTouches[0].pageY-(d.offset()?d.offset().top:0)):Math.round(b.pageY-(d.offset()?d.offset().top:0))},time:Date.now(),target:b.target}}function k(b){d=a(b.currentTarget),d.data("callee2",k),h.x=b.originalEvent.targetTouches?b.originalEvent.targetTouches[0].pageX:b.pageX,h.y=b.originalEvent.targetTouches?b.originalEvent.targetTouches[0].pageY:b.pageY;var j,l=d.parent().data("xthreshold")?d.parent().data("xthreshold"):d.data("xthreshold"),m=d.parent().data("ythreshold")?d.parent().data("ythreshold"):d.data("ythreshold"),n="undefined"!=typeof l&&l!==!1&&parseInt(l)?parseInt(l):c.swipe_h_threshold,o="undefined"!=typeof m&&m!==!1&&parseInt(m)?parseInt(m):c.swipe_v_threshold;if(g.y>h.y&&g.y-h.y>o&&(j="swipeup"),g.x<h.x&&h.x-g.x>n&&(j="swiperight"),g.y<h.y&&h.y-g.y>o&&(j="swipedown"),g.x>h.x&&g.x-h.x>n&&(j="swipeleft"),void 0!=j&&e){g.x=0,g.y=0,h.x=0,h.y=0,e=!1;var p=b.originalEvent,q={position:{x:c.touch_capable?p.touches[0].screenX:b.screenX,y:c.touch_capable?p.touches[0].screenY:b.screenY},offset:{x:c.touch_capable?Math.round(p.changedTouches[0].pageX-(d.offset()?d.offset().left:0)):Math.round(b.pageX-(d.offset()?d.offset().left:0)),y:c.touch_capable?Math.round(p.changedTouches[0].pageY-(d.offset()?d.offset().top:0)):Math.round(b.pageY-(d.offset()?d.offset().top:0))},time:Date.now(),target:b.target},r=Math.abs(i.position.x-q.position.x),s=Math.abs(i.position.y-q.position.y),t={startEvnt:i,endEvnt:q,direction:j.replace("swipe",""),xAmount:r,yAmount:s,duration:q.time-i.time};f=!0,d.trigger("swipe",t).trigger(j,t)}}function l(b){d=a(b.currentTarget);var g="";if(d.data("callee3",l),f){var h=d.data("xthreshold"),j=d.data("ythreshold"),k="undefined"!=typeof h&&h!==!1&&parseInt(h)?parseInt(h):c.swipe_h_threshold,m="undefined"!=typeof j&&j!==!1&&parseInt(j)?parseInt(j):c.swipe_v_threshold,n=b.originalEvent,o={position:{x:c.touch_capable?n.changedTouches[0].screenX:b.screenX,y:c.touch_capable?n.changedTouches[0].screenY:b.screenY},offset:{x:c.touch_capable?Math.round(n.changedTouches[0].pageX-(d.offset()?d.offset().left:0)):Math.round(b.pageX-(d.offset()?d.offset().left:0)),y:c.touch_capable?Math.round(n.changedTouches[0].pageY-(d.offset()?d.offset().top:0)):Math.round(b.pageY-(d.offset()?d.offset().top:0))},time:Date.now(),target:b.target};i.position.y>o.position.y&&i.position.y-o.position.y>m&&(g="swipeup"),i.position.x<o.position.x&&o.position.x-i.position.x>k&&(g="swiperight"),i.position.y<o.position.y&&o.position.y-i.position.y>m&&(g="swipedown"),i.position.x>o.position.x&&i.position.x-o.position.x>k&&(g="swipeleft");var p=Math.abs(i.position.x-o.position.x),q=Math.abs(i.position.y-o.position.y),r={startEvnt:i,endEvnt:o,direction:g.replace("swipe",""),xAmount:p,yAmount:q,duration:o.time-i.time};d.trigger("swipeend",r)}e=!1,f=!1}var i,b=this,d=a(b),e=!1,f=!1,g={x:0,y:0},h={x:0,y:0};d.on(c.startevent,j),d.on(c.moveevent,k),d.on(c.endevent,l)},remove:function(){a(this).off(c.startevent,a(this).data.callee1).off(c.moveevent,a(this).data.callee2).off(c.endevent,a(this).data.callee3)}},a.event.special.scrollstart={setup:function(){function g(a,c){e=c,u(b,e?"scrollstart":"scrollend",a)}var e,f,b=this,d=a(b);d.on(c.scrollevent,function a(b){d.data("callee",a),e||g(b,!0),clearTimeout(f),f=setTimeout(function(){g(b,!1)},50)})},remove:function(){a(this).off(c.scrollevent,a(this).data.callee)}};var e,f,g,h,i,d=a(window),j={0:!0,180:!0};if(c.orientation_support){var k=window.innerWidth||d.width(),l=window.innerHeight||d.height(),m=50;h=k>l&&k-l>m,i=j[window.orientation],(h&&i||!h&&!i)&&(j={"-90":!0,90:!0})}a.event.special.orientationchange=e={setup:function(){return!c.orientation_support&&(g=f(),d.on("throttledresize",n),!0)},teardown:function(){return!c.orientation_support&&(d.off("throttledresize",n),!0)},add:function(a){var b=a.handler;a.handler=function(a){return a.orientation=f(),b.apply(this,arguments)}}},a.event.special.orientationchange.orientation=f=function(){var a=!0,b=document.documentElement;return a=c.orientation_support?j[window.orientation]:b&&b.clientWidth/b.clientHeight<1.1,a?"portrait":"landscape"},a.event.special.throttledresize={setup:function(){a(this).on("resize",p)},teardown:function(){a(this).off("resize",p)}};var r,s,t,o=250,p=function(){s=Date.now(),t=s-q,t>=o?(q=s,a(this).trigger("throttledresize")):(r&&window.clearTimeout(r),r=window.setTimeout(n,o-t))},q=0;a.each({scrollend:"scrollstart",swipeup:"swipe",swiperight:"swipe",swipedown:"swipe",swipeleft:"swipe",swipeend:"swipe",tap2:"tap"},function(b,c){a.event.special[b]={setup:function(){a(this).on(c,a.noop)}}})}(jQuery);


/*!
 * jQuery UI Touch Punch 0.2.3
 *
 * Copyright 2011–2014, Dave Furfero
 * Dual licensed under the MIT or GPL Version 2 licenses.
 *
 * Modified for Nextcloud Gallery by Olivier Paroz to convert taphold events into clicks instead of
 * using touchstart
 * @see https://stackoverflow.com/questions/34027761/jquery-ui-sortable-hold-and-drag-for-mobile
 *
 * Depends:
 *  jquery.ui.widget.js
 *  jquery.ui.mouse.js
 */
(function ($) {

  // Detect touch support
  $.support.touch = 'ontouchend' in document;

  // Ignore browsers without touch support
  if (!$.support.touch) {
    return;
  }

  var mouseProto = $.ui.mouse.prototype,
      _mouseInit = mouseProto._mouseInit,
      _mouseDestroy = mouseProto._mouseDestroy,
      touchHandled;

  /**
   * Simulate a mouse event based on a corresponding touch event
   * @param {Object} event A touch event
   * @param {String} simulatedType The corresponding mouse event
   */
  function simulateMouseEvent (event, simulatedType) {

    // Ignore multi-touch events
    if (event.originalEvent.touches.length > 1) {
      return;
    }

    event.preventDefault();

    var touch = event.originalEvent.changedTouches[0],
        simulatedEvent = document.createEvent('MouseEvents');
    
    // Initialize the simulated mouse event using the touch event's coordinates
    simulatedEvent.initMouseEvent(
      simulatedType,    // type
      true,             // bubbles                    
      true,             // cancelable                 
      window,           // view                       
      1,                // detail                     
      touch.screenX,    // screenX                    
      touch.screenY,    // screenY                    
      touch.clientX,    // clientX                    
      touch.clientY,    // clientY                    
      false,            // ctrlKey                    
      false,            // altKey                     
      false,            // shiftKey                   
      false,            // metaKey                    
      0,                // button                     
      null              // relatedTarget              
    );

    // Dispatch the simulated event to the target element
    event.target.dispatchEvent(simulatedEvent);
  }

  /**
   * Handle the jQuery UI widget's touchstart events
   * @param {Object} event The widget element's touchstart event
   */
  mouseProto._touchStart = function (event) {

    var self = this;

    // Ignore the event if another widget is already being handled
    if (touchHandled || !self._mouseCapture(event.originalEvent.changedTouches[0])) {
      return;
    }

    // Set the flag to prevent other widgets from inheriting the touch event
    touchHandled = true;

    // Track movement to determine if interaction was a click
    self._touchMoved = false;

    // Simulate the mouseover event
    simulateMouseEvent(event, 'mouseover');

    // Simulate the mousemove event
    simulateMouseEvent(event, 'mousemove');

    // Simulate the mousedown event
    simulateMouseEvent(event, 'mousedown');
  };

  /**
   * Handle the jQuery UI widget's touchmove events
   * @param {Object} event The document's touchmove event
   */
  mouseProto._touchMove = function (event) {

    // Ignore event if not handled
    if (!touchHandled) {
      return;
    }

    // Interaction was not a click
    this._touchMoved = true;

    // Simulate the mousemove event
    simulateMouseEvent(event, 'mousemove');
  };

  /**
   * Handle the jQuery UI widget's touchend events
   * @param {Object} event The document's touchend event
   */
  mouseProto._touchEnd = function (event) {

    // Ignore event if not handled
    if (!touchHandled) {
      return;
    }

    // Simulate the mouseup event
    simulateMouseEvent(event, 'mouseup');

    // Simulate the mouseout event
    simulateMouseEvent(event, 'mouseout');

    // If the touch interaction did not move, it should trigger a click
    if (!this._touchMoved) {

      // Simulate the click event
      simulateMouseEvent(event, 'click');
    }

    // Unset the flag to allow other widgets to inherit the touch event
    touchHandled = false;
  };

  /**
   * A duck punch of the $.ui.mouse _mouseInit method to support touch events.
   * This method extends the widget with bound touch event handlers that
   * translate touch events to mouse events and pass them to the widget's
   * original mouse event handling methods.
   */
  mouseProto._mouseInit = function () {
    
    var self = this;

    // Delegate the touch handlers to the widget's element
    self.element.bind({
      taphold: $.proxy(self, '_touchStart'),
      touchmove: $.proxy(self, '_touchMove'),
      touchend: $.proxy(self, '_touchEnd')
    });

    // Call the original $.ui.mouse init method
    _mouseInit.call(self);
  };

  /**
   * Remove the touch event handlers
   */
  mouseProto._mouseDestroy = function () {
    
    var self = this;

    // Delegate the touch handlers to the widget's element
    self.element.unbind({
      taphold: $.proxy(self, '_touchStart'),
      touchmove: $.proxy(self, '_touchMove'),
      touchend: $.proxy(self, '_touchEnd')
    });

    // Call the original $.ui.mouse destroy method
    _mouseDestroy.call(self);
  };

})(jQuery);

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
/* global Album, GalleryImage */
(function ($, OC, t) {
	"use strict";
	var Gallery = {
		currentAlbum: null,
		currentEtag: null,
		config: {},
		/** Map of the whole gallery, built as we navigate through folders */
		albumMap: {},
		/** Used to pick an image based on the URL */
		imageMap: {},
		appName: 'gallery',
		token: undefined,
		activeSlideShow: null,
		buttonsWidth: 600,
		browserToolbarHeight: 150,
		filesClient: null,

		/**
		 * Refreshes the view and starts the slideshow if required
		 *
		 * @param {string} path
		 * @param {string} albumPath
		 */
		refresh: function (path, albumPath) {
			if (Gallery.currentAlbum !== albumPath) {
				Gallery.view.init(albumPath, null);
			}

			// If the path is mapped, that means that it's an albumPath
			if (Gallery.albumMap[path]) {
				if (Gallery.activeSlideShow) {
					Gallery.activeSlideShow.stop();
				}
			} else if (Gallery.imageMap[path] && Gallery.activeSlideShow.active === false) {
				Gallery.view.startSlideshow(path, albumPath);
			}
		},

		/**
		 * Retrieves information about all the images and albums located in the current folder
		 *
		 * @param {string} currentLocation
		 *
		 * @returns {*}
		 */
		getFiles: function (currentLocation) {
			// Cache the sorting order of the current album before loading new files
			if (!$.isEmptyObject(Gallery.albumMap)) {
				Gallery.albumMap[Gallery.currentAlbum].sorting = Gallery.config.albumSorting;
			}
			// Checks if we've visited this location before ands saves the etag to use for
			// comparison later
			var albumEtag;
			var albumCache = Gallery.albumMap[decodeURIComponent(currentLocation)];
			if (!$.isEmptyObject(albumCache)) {
				albumEtag = albumCache.etag;
			}

			// Sends the request to the server
			var params = {
				location: currentLocation,
				mediatypes: Gallery.config.getMediaTypes(),
				features: Gallery.config.getFeatures(),
				etag: albumEtag
			};
			// Only use the folder as a GET parameter and not as part of the URL
			var url = Gallery.utility.buildGalleryUrl('files', '/list', params);
			return $.getJSON(url).then(
				function (/**@type{{
					* files:Array,
					* albums:Array,
					* albumconfig:Object,
					* albumpath:String,
					* updated:Boolean}}*/
						  data) {
					var albumpath = data.albumpath;
					var updated = data.updated;
					// FIXME albumConfig should be cached as well
					/**@type {{design,information,sorting,error: string}}*/
					var albumConfig = data.albumconfig;
					//Gallery.config.setAlbumPermissions(currentAlbum);
					Gallery.config.setAlbumConfig(albumConfig, albumpath);
					// Both the folder and the etag have to match
					if ((decodeURIComponent(currentLocation) === albumpath) &&
						(updated === false)) {
						Gallery.imageMap = albumCache.imageMap;
					} else {
						Gallery._mapFiles(data);
					}

					// Restore the previous sorting order for this album
					if (!$.isEmptyObject(Gallery.albumMap[albumpath].sorting)) {
						Gallery.config.updateAlbumSorting(
							Gallery.albumMap[albumpath].sorting);
					}

				}, function (xhr) {
					var result = xhr.responseJSON;
					var albumPath = decodeURIComponent(currentLocation);
					var message;
					if (result === null) {
						message = t('gallery', 'There was a problem reading files from this album');
					} else {
						message = result.message;
					}
					Gallery.view.init(albumPath, message);
					Gallery._mapStructure(albumPath);
				});
		},

		/**
		 * Sorts albums and images based on user preferences
		 */
		sorter: function () {
			var sortType = 'name';
			var sortOrder = 'asc';
			var albumSortType = 'name';
			var albumSortOrder = 'asc';
			if (this.id === 'sort-date-button') {
				sortType = 'date';

			}
			var currentSort = Gallery.config.albumSorting;
			if (currentSort.type === sortType && currentSort.order === sortOrder) {
				sortOrder = 'des';
			}

			// Update the controls
			Gallery.view.sortControlsSetup(sortType, sortOrder);

			// We can't currently sort by album creation time
			if (sortType === 'name') {
				albumSortOrder = sortOrder;
			}

			// FIXME Rendering is still happening while we're sorting...

			// Clear before sorting
			Gallery.view.clear();

			// Sort the images
			Gallery.albumMap[Gallery.currentAlbum].images.sort(Gallery.utility.sortBy(sortType,
				sortOrder));
			Gallery.albumMap[Gallery.currentAlbum].subAlbums.sort(
				Gallery.utility.sortBy(albumSortType,
					albumSortOrder));

			// Save the new settings
			var sortConfig = {
				type: sortType,
				order: sortOrder,
				albumOrder: albumSortOrder
			};
			Gallery.config.updateAlbumSorting(sortConfig);

			// Refresh the view
			Gallery.view.viewAlbum(Gallery.currentAlbum);
		},

		/**
		 * Switches to the Files view
		 *
		 * @param event
		 */
		switchToFilesView: function (event) {
			event.stopPropagation();

			var subUrl = '';
			var params = {path: '/' + Gallery.currentAlbum};
			if (Gallery.token) {
				params.token = Gallery.token;
				subUrl = 's/{token}?path={path}';
			} else {
				subUrl = 'apps/files?dir={path}';
			}

			var button = $('#filelist-button');
			button.children('img').addClass('hidden');
			button.children('#button-loading').removeClass('hidden').addClass('icon-loading-small');
			OC.redirect(OC.generateUrl(subUrl, params));
		},

		/**
		 * Populates the share dialog with the needed information
		 *
		 * @param event
		 */
		share: function (event) {
			// Clicking on share button does not trigger automatic slide-up
			$('.album-info-container').slideUp();

			if (!Gallery.Share.droppedDown) {
				event.preventDefault();
				event.stopPropagation();

				var currentAlbum = Gallery.albumMap[Gallery.currentAlbum];
				$('#controls a.share').data('path', currentAlbum.path)
					.data('link', true)
					.data('item-source', currentAlbum.fileId)
					.data('possible-permissions', currentAlbum.permissions)
					.click();
			}
		},

		/**
		 * Sends an archive of the current folder to the browser
		 *
		 * @param event
		 */
		download: function (event) {
			event.preventDefault();

			var path = $('#content').data('albumname');
			var files = Gallery.currentAlbum;
			var downloadUrl = Gallery.utility.buildFilesUrl(path, files);

			OC.redirect(downloadUrl);
		},

		/**
		 * Shows an information box to the user
		 *
		 * @param event
		 */
		showInfo: function (event) {
			event.stopPropagation();
			Gallery.infoBox.showInfo();
		},

		/**
		 * Lets the user add the shared files to his cloud
		 */
		showSaveForm: function () {
			$(this).hide();
			$('.save-form').css('display', 'inline');
			$('#remote_address').focus();
		},

		/**
		 * Sends the shared files to the viewer's cloud
		 *
		 * @param event
		 */
		saveForm: function (event) {
			event.preventDefault();

			var saveElement = $('#save');
			var remote = $(this).find('input[type="text"]').val();
			var owner = saveElement.data('owner');
			var name = saveElement.data('name');
			var isProtected = saveElement.data('protected');
			Gallery._saveToServer(remote, Gallery.token, owner, name, isProtected);
		},

		/**
		 * Creates a new slideshow using the images found in the current folder
		 *
		 * @param {Array} images
		 * @param {string} startImage
		 * @param {boolean} autoPlay
		 *
		 * @returns {boolean}
		 */
		slideShow: function (images, startImage, autoPlay) {
			if (startImage === undefined) {
				OC.Notification.showTemporary(t('gallery',
					'Aborting preview. Could not find the file'));
				return false;
			}
			var start = images.indexOf(startImage);
			images = images.filter(function (image, index) {
				// If the slideshow is loaded before we get a thumbnail, we have to accept all
				// images
				if (!image.thumbnail) {
					return image;
				} else {
					if (image.thumbnail.valid) {
						return image;
					} else if (index < images.indexOf(startImage)) {
						start--;
					}
				}
			}).map(function (image) {
				var name = OC.basename(image.path);
				var previewUrl = Gallery.utility.getPreviewUrl(image.fileId, image.etag);
				var params = {
					c: image.etag,
					requesttoken: oc_requesttoken
				};
				var downloadUrl = Gallery.utility.buildGalleryUrl('files',
					'/download/' + image.fileId,
					params);

				return {
					name: name,
					path: image.path,
					file: image.fileId,
					mimeType: image.mimeType,
					permissions: image.permissions,
					url: previewUrl,
					downloadUrl: downloadUrl
				};
			});
			Gallery.activeSlideShow.setImages(images, autoPlay);
			Gallery.activeSlideShow.onStop = function () {
				$('#content').show();
				Gallery.view.removeLoading();
				if (Gallery.currentAlbum !== '') {
					// Only modern browsers can manipulate history
					if (history && history.replaceState) {
						history.replaceState('', '',
							'#' + encodeURIComponent(Gallery.currentAlbum));
					} else {
						location.hash = '#' + encodeURIComponent(Gallery.currentAlbum);
					}
				} else {
					// Only modern browsers can manipulate history
					if (history && history.replaceState) {
						history.replaceState('', '', '#');
					} else {
						location.hash = '#';
					}
				}
			};
			Gallery.activeSlideShow.show(start);
			if(!_.isUndefined(Gallery.Share)){
				Gallery.Share.hideDropDown();
			}
			$('.album-info-container').slideUp();
			// Resets the last focused element
			document.activeElement.blur();
		},

		/**
		 * Moves files and albums to a new location
		 *
		 * @param {jQuery} $item
		 * @param {string} fileName
		 * @param {string} filePath
		 * @param {jQuery} $target
		 * @param {string} targetPath
		 */
		move: function ($item, fileName, filePath, $target, targetPath) {
			var self = this;
			var dir = Gallery.currentAlbum;

			if (targetPath.charAt(targetPath.length - 1) !== '/') {
				// make sure we move the files into the target dir,
				// not overwrite it
				targetPath = targetPath + '/';
			}
			self.filesClient.move(dir + '/' + fileName, targetPath + fileName)
				.done(function () {
					self._removeElement(dir, filePath, $item);
				})
				.fail(function (status) {
					if (status === 412) {
						// TODO: some day here we should invoke the conflict dialog
						OC.Notification.showTemporary(
							t('gallery', 'Could not move "{file}", target exists', {file: fileName})
						);
					} else {
						OC.Notification.showTemporary(
							t('gallery', 'Could not move "{file}"', {file: fileName})
						);
					}
					$item.fadeTo("normal", 1);
					$target.children('.album-loader').hide();
				})
				.always(function () {
					// Nothing?
				});
		},

		/**
		 * Builds the album's model
		 *
		 * @param {{
		 * 	files:Array,
		 * 	albums:Array,
		 * 	albumconfig:Object,
		 * 	albumpath:String,
		 *	updated:Boolean
		 * 	}} data
		 * @private
		 */
		_mapFiles: function (data) {
			Gallery.imageMap = {};
			var image = null;
			var path = null;
			var fileId = null;
			var mimeType = null;
			var mTime = null;
			var etag = null;
			var size = null;
			var sharedWithUser = null;
			var owner = null;
			var permissions = 0;
			var currentLocation = data.albumpath;
			// This adds a new node to the map for each parent album
			Gallery._mapStructure(currentLocation);
			var files = data.files;
			if (files.length > 0) {
				var subAlbumCache = {};
				var albumCache = Gallery.albumMap[currentLocation]
					= new Album(
					currentLocation,
					[],
					[],
					OC.basename(currentLocation),
					data.albums[currentLocation].nodeid,
					data.albums[currentLocation].mtime,
					data.albums[currentLocation].etag,
					data.albums[currentLocation].size,
					data.albums[currentLocation].sharedwithuser,
					data.albums[currentLocation].owner,
					data.albums[currentLocation].freespace,
					data.albums[currentLocation].permissions
				);
				for (var i = 0; i < files.length; i++) {
					path = files[i].path;
					fileId = files[i].nodeid;
					mimeType = files[i].mimetype;
					mTime = files[i].mtime;
					etag = files[i].etag;
					size = files[i].size;
					sharedWithUser = files[i].sharedwithuser;
					owner = files[i].owner;
					permissions = files[i].permissions;

					image =
						new GalleryImage(
							path, path, fileId, mimeType, mTime, etag, size, sharedWithUser, owner, permissions
						);

					// Determines the folder name for the image
					var dir = OC.dirname(path);
					if (dir === path) {
						dir = '';
					}
					if (dir === currentLocation) {
						// The image belongs to the current album, so we can add it directly
						albumCache.images.push(image);
					} else {
						// The image belongs to a sub-album, so we create a sub-album cache if it
						// doesn't exist and add images to it
						if (!subAlbumCache[dir]) {
							subAlbumCache[dir] = new Album(
								dir,
								[],
								[],
								OC.basename(dir),
								data.albums[dir].nodeid,
								data.albums[dir].mtime,
								data.albums[dir].etag,
								data.albums[dir].size,
								data.albums[dir].sharedwithuser,
								data.albums[currentLocation].owner,
								data.albums[currentLocation].freespace,
								data.albums[dir].permissions);
						}
						subAlbumCache[dir].images.push(image);
						// The sub-album also has to be added to the global map
						if (!Gallery.albumMap[dir]) {
							Gallery.albumMap[dir] = {};
						}
					}
					Gallery.imageMap[image.path] = image;
				}
				// Adds the sub-albums to the current album
				Gallery._mapAlbums(albumCache, subAlbumCache);

				// Caches the information which is not already cached
				albumCache.etag = data.albums[currentLocation].etag;
				albumCache.imageMap = Gallery.imageMap;
			}
		},

		/**
		 * Adds every album leading to the current folder to a global album map
		 *
		 * Per example, if you have Root/Folder1/Folder2/CurrentFolder then the map will contain:
		 *    * Root
		 *    * Folder1
		 *    * Folder2
		 *    * CurrentFolder
		 *
		 *  Every time a new location is loaded, the map is completed
		 *
		 *
		 * @param {string} path
		 *
		 * @returns {Album}
		 * @private
		 */
		_mapStructure: function (path) {
			if (!Gallery.albumMap[path]) {
				Gallery.albumMap[path] = {};
				// Builds relationships between albums
				if (path !== '') {
					var parent = OC.dirname(path);
					if (parent === path) {
						parent = '';
					}
					Gallery._mapStructure(parent);
				}
			}
			return Gallery.albumMap[path];
		},

		/**
		 * Adds the sub-albums to the current album
		 *
		 * @param {Album} albumCache
		 * @param {{Album}} subAlbumCache
		 * @private
		 */
		_mapAlbums: function (albumCache, subAlbumCache) {
			for (var j = 0, keys = Object.keys(subAlbumCache); j <
			keys.length; j++) {
				albumCache.subAlbums.push(subAlbumCache[keys[j]]);
			}
		},

		/**
		 * Saves the folder to a remote server
		 *
		 * Our location is the remote for the other server
		 *
		 * @param {string} remote
		 * @param {string}token
		 * @param {string}owner
		 * @param {string}name
		 * @param {boolean} isProtected
		 * @private
		 */
		_saveToServer: function (remote, token, owner, name, isProtected) {
			var location = window.location.protocol + '//' + window.location.host + OC.webroot;
			var isProtectedInt = (isProtected) ? 1 : 0;
			var url = remote + '/index.php/apps/files#' + 'remote=' + encodeURIComponent(location)
				+ "&token=" + encodeURIComponent(token) + "&owner=" + encodeURIComponent(owner) +
				"&name=" +
				encodeURIComponent(name) + "&protected=" + isProtectedInt;

			if (remote.indexOf('://') > 0) {
				OC.redirect(url);
			} else {
				// if no protocol is specified, we automatically detect it by testing https and
				// http
				// this check needs to happen on the server due to the Content Security Policy
				// directive
				$.get(OC.generateUrl('apps/files_sharing/testremote'),
					{remote: remote}).then(function (protocol) {
					if (protocol !== 'http' && protocol !== 'https') {
						OC.dialogs.alert(t('files_sharing',
							'No compatible server found at {remote}',
							{remote: remote}),
							t('files_sharing', 'Invalid server url'));
					} else {
						OC.redirect(protocol + '://' + url);
					}
				});
			}
		},

		/**
		 * Removes the moved element from the UI and refreshes the view
		 *
		 * @param {string} dir
		 * @param {string}filePath
		 * @param {jQuery} $item
		 * @private
		 */
		_removeElement: function (dir, filePath, $item) {
			var images = Gallery.albumMap[Gallery.currentAlbum].images;
			var albums = Gallery.albumMap[Gallery.currentAlbum].subAlbums;
			// if still viewing the same directory
			if (Gallery.currentAlbum === dir) {
				var removed = false;
				// We try to see if an image was removed
				var movedImage = _(images).findIndex({path: filePath});
				if (movedImage >= 0) {
					images.splice(movedImage, 1);
					removed = true;
				} else {
					// It wasn't an image, so try to remove an album
					var movedAlbum = _(albums).findIndex({path: filePath});
					if (movedAlbum >= 0) {
						albums.splice(movedAlbum, 1);
						removed = true;
					}
				}

				if (removed) {
					$item.remove();
					// Refresh the photowall without checking if new files have arrived in the
					// current album
					// TODO On the next visit this album is going to be reloaded, unless we can get
					// an etag back from the move endpoint
					Gallery.view.init(Gallery.currentAlbum);
				}
			}
		}
	};
	window.Gallery = Gallery;
})(jQuery, OC, t);


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
/* global Gallery */
(function ($, Gallery) {
	"use strict";
	/**
	 * Stores the gallery configuration
	 *
	 * @param {{features: string[], mediatypes: string[]}} config
	 * @constructor
	 */
	var Config = function (config) {
		this.galleryFeatures = this._setGalleryFeatures(config.features);
		this.mediaTypes = this._setMediaTypes(config.mediatypes);
	};

	Config.prototype = {
		galleryFeatures: [],
		cachedFeaturesString: '',
		mediaTypes: [],
		cachedMediaTypesString: '',
		albumInfo: null,
		albumSorting: null,
		albumDesign: null,
		albumError: false,
		infoLoaded: false,

		/**
		 * Returns the list of supported features in a string
		 *
		 * @returns {string}
		 */
		getFeatures: function () {
			return this.cachedFeaturesString;
		},

		/**
		 * Returns the list of supported media types in a string
		 *
		 * @returns {string}
		 */
		getMediaTypes: function () {
			return this.cachedMediaTypesString;
		},

		/**
		 * Stores the configuration about the current album
		 *
		 * @param {{
		 * 	design,
		 * 	information,
		 * 	sorting,
		 * 	error: string
		 * }} albumConfig
		 * @param albumPath
		 */
		setAlbumConfig: function (albumConfig, albumPath) {
			this.albumInfo = this._setAlbumInfo(albumConfig, albumPath);
			this.albumSorting = this._setAlbumSorting(albumConfig);
			this.albumDesign = this._setAlbumDesign(albumConfig);
			this.albumError = albumConfig.error;
		},

		/**
		 * Updates the sorting order
		 */
		updateAlbumSorting: function (sortConfig) {
			this.albumSorting = {
				type: sortConfig.type,
				order: sortConfig.order,
				albumOrder: sortConfig.albumOrder
			};
		},

		/**
		 * Saves the list of features which have been enabled in the app
		 *
		 * @param {string[]} configFeatures
		 *
		 * @returns {Array}
		 * @private
		 */
		_setGalleryFeatures: function (configFeatures) {
			var features = [];
			var feature = null;
			var i, configFeaturesLength = configFeatures.length;
			if (configFeaturesLength) {
				for (i = 0; i < configFeaturesLength; i++) {
					feature = configFeatures[i];
					if (this._worksInCurrentBrowser(feature, 'native_svg')) {
						features.push(feature);
						Gallery.utility.addDomPurifyHooks();
					}
				}
			}
			this.cachedFeaturesString = features.join(';');

			return features;
		},

		/**
		 * Saves the list of supported media types
		 *
		 * @param {string[]} mediaTypes
		 *
		 * @returns {Array}
		 * @private
		 */
		_setMediaTypes: function (mediaTypes) {
			var supportedMediaTypes = [];
			var mediaType = null;
			var i, mediaTypesLength = mediaTypes.length;
			if (mediaTypesLength) {
				for (i = 0; i < mediaTypesLength; i++) {
					mediaType = mediaTypes[i];
					if (this._worksInCurrentBrowser(mediaType, 'image/svg+xml')) {
						supportedMediaTypes.push(mediaType);
					}
				}
			}
			this.cachedMediaTypesString = supportedMediaTypes.join(';');

			return supportedMediaTypes;
		},

		/**
		 * Determines if we can accept a specific config element in Internet Explorer
		 *
		 * @param {string} feature
		 * @param {string} validationRule
		 *
		 * @returns {boolean}
		 * @private
		 */
		_worksInCurrentBrowser: function (feature, validationRule) {
			var isAcceptable = true;
			if (feature === validationRule &&
				(Gallery.ieVersion !== false && Gallery.ieVersion !== 'edge')) {
				isAcceptable = false;
			}

			return isAcceptable;
		},

		/**
		 * Saves the description and copyright information for the current album
		 *
		 * @param {{
		 * 	design,
		 * 	information,
		 * 	sorting,
		 * 	error: string
		 * }} albumConfig
		 * @param albumPath
		 *
		 * @returns {null||{
		 * 	description: string,
		 * 	descriptionLink: string,
		 * 	copyright: string,
		 * 	copyrightLink: string,
		 * 	filePath: string,
		 * 	inherit: bool,
		 * 	level: number
		 * }}
		 * @private
		 */
		_setAlbumInfo: function (albumConfig, albumPath) {
			/**@type {{
			 * 	description: string,
			 * 	description_link: string,
			 * 	copyright: string,
			 * 	copyright_link: string,
			 * 	inherit: bool,
			 * 	level: number
			 * }}
			 */
			var albumInfo = albumConfig.information;
			var params = null;
			if (!$.isEmptyObject(albumInfo)) {
				var docPath = albumPath;
				var level = albumInfo.level;
				if (level > 0) {
					if (docPath.indexOf('/') !== -1) {
						var folders = docPath.split('/');
						folders = folders.slice(-0, -level);
						docPath = folders.join('/') + '/';
					} else {
						docPath = '';
					}
				}

				/* jshint camelcase: false */
				params = {
					description: albumInfo.description,
					descriptionLink: albumInfo.description_link,
					copyright: albumInfo.copyright,
					copyrightLink: albumInfo.copyright_link,
					filePath: docPath,
					inherit: albumInfo.inherit,
					level: level
				};
			}

			return params;
		},

		/**
		 * Saves the description and copyright information for the current album
		 *
		 * @param {{
		 * 	design,
		 * 	information,
		 * 	sorting,
		 * 	error: string
		 * }} albumConfig
		 *
		 * @returns {null||{
		 * 	background: string,
		 * 	inherit: bool,
		 * 	level: number
		 * }}
		 * @private
		 */
		_setAlbumDesign: function (albumConfig) {
			/**@type {{
			 * 	background: string,
			 * 	inherit: bool,
			 * 	level: number
			 * }}
			 */
			var albumDesign = albumConfig.design;
			var params = null;
			if (!$.isEmptyObject(albumDesign)) {
				params = {
					background: albumDesign.background,
					inherit: albumDesign.inherit,
					level: albumDesign.level
				};
			}

			return params;
		},

		/**
		 * Saves the sorting configuration for the current album
		 *
		 * @param {{
		 * 	design,
		 * 	information,
		 * 	sorting,
		 * 	error: string
		 * }} albumConfig
		 *
		 * @returns {{type: string, order: string, albumOrder: string}}
		 * @private
		 */
		_setAlbumSorting: function (albumConfig) {
			var sortType = 'name';
			var sortOrder = 'asc';
			var albumSortOrder = 'asc';
			if (!$.isEmptyObject(albumConfig.sorting)) {
				if (!$.isEmptyObject(albumConfig.sorting.type)) {
					sortType = albumConfig.sorting.type;
				}
				if (!$.isEmptyObject(albumConfig.sorting.order)) {
					sortOrder = albumConfig.sorting.order;
					if (sortType === 'name') {
						albumSortOrder = sortOrder;
					}
				}
			}

			return {
				type: sortType,
				order: sortOrder,
				albumOrder: albumSortOrder
			};
		}
	};

	Gallery.Config = Config;
})(jQuery, Gallery);


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
/* global Gallery, commonmark, DOMPurify */
(function ($, t, Gallery) {
	"use strict";
	/**
	 * Shows some information about the current album
	 *
	 * @constructor
	 */
	var InfoBox = function () {
		this.infoContentContainer = $('.album-info-container');
		this.infoContentSpinner = this.infoContentContainer.children('.album-info-loader');
		this.infoContentElement = this.infoContentContainer.children('.album-info-content');
		this.markdownReader = new commonmark.Parser();
		this.htmlWriter = new commonmark.HtmlRenderer();
	};

	InfoBox.prototype = {
		infoContentContainer: null,
		infoContentSpinner: null,
		infoContentElement: null,
		albumInfo: null,
		markdownReader: null,
		htmlWriter: null,

		/**
		 * Shows an information box to the user
		 */
		showInfo: function () {
			if(!_.isUndefined(Gallery.Share)){
				Gallery.Share.hideDropDown();
			}
			if (this.infoContentContainer.is(':visible')) {
				this.infoContentContainer.slideUp();
			} else {
				this.albumInfo = Gallery.config.albumInfo;

				if (!this.albumInfo.infoLoaded) {
					this.infoContentSpinner.addClass('icon-loading');
					this.infoContentElement.empty();
					this.infoContentElement.height(100);
					this.infoContentContainer.slideDown();
					if (!$.isEmptyObject(this.albumInfo.descriptionLink)) {
						var path = '/' + this.albumInfo.filePath;
						var file = this.albumInfo.descriptionLink;
						var descriptionUrl = Gallery.utility.buildFilesUrl(path, file);
						var thisInfoBox = this;
						$.get(descriptionUrl).done(function (data) {
								thisInfoBox._addContent(data);
							}
						).fail(function () {
							thisInfoBox._addContent(t('gallery',
								'Could not load the description'));
						});
					} else {
						this._addContent(this.albumInfo.description);
					}
					Gallery.config.infoLoaded = true;
				} else {
					this.infoContentContainer.slideDown();
				}
				this.infoContentContainer.scrollTop(0);
			}
		},

		/**
		 * Adds our album information to the infoBox
		 *
		 * @param {string} content
		 * @private
		 */
		_addContent: function (content) {
			try {
				content = this._parseMarkdown(content);
			} catch (exception) {
				content = t('gallery',
					'Could not load the description: ' + exception.message);
			}
			this.infoContentElement.append(content);
			this.infoContentElement.find('a').attr("target", "_blank");
			this._showCopyright();
			this._adjustHeight();
		},

		/**
		 * Parses markdown content and sanitizes the HTML
		 *
		 * @param {string} content
		 * @private
		 */
		_parseMarkdown: function (content) {
			return DOMPurify.sanitize(this.htmlWriter.render(this.markdownReader.parse(content), {
				smart: true,
				safe: true
			}), {
				ALLOWED_TAGS: ['p', 'b', 'em', 'i', 'pre', 'sup', 'sub', 'strong', 'strike', 'br',
					'hr', 'h1', 'h2', 'h3', 'li', 'ul', 'ol', 'a', 'img', 'blockquote', 'code'
				]
			});
		},

		/**
		 * Adjusts the height of the element to match the content
		 * @private
		 */
		_adjustHeight: function () {
			this.infoContentSpinner.removeClass('icon-loading');
			var newHeight = this.infoContentContainer[0].scrollHeight;
			this.infoContentContainer.animate({
				height: newHeight + 40
			}, 500);
			this.infoContentContainer.scrollTop(0);
		},

		/**
		 * Adds copyright information to the information box
		 * @private
		 */
		_showCopyright: function () {
			if (!$.isEmptyObject(this.albumInfo.copyright) ||
				!$.isEmptyObject(this.albumInfo.copyrightLink)) {
				var copyright;
				var copyrightTitle = $('<h4/>');
				copyrightTitle.append(t('gallery', 'Copyright'));
				this.infoContentElement.append(copyrightTitle);

				if (!$.isEmptyObject(this.albumInfo.copyright)) {
					try {
						copyright = this._parseMarkdown(this.albumInfo.copyright);
					} catch (exception) {
						copyright =
							t('gallery',
								'Could not load the copyright notice: ' + exception.message);
					}
				} else {
					copyright = '<p>' + t('gallery', 'Copyright notice') + '</p>';
				}

				if (!$.isEmptyObject(this.albumInfo.copyrightLink)) {
					this._addCopyrightLink(copyright);
				} else {
					this.infoContentElement.append(copyright);
					this.infoContentElement.find('a').attr("target", "_blank");
				}
			}
		},

		/**
		 * Adds a link to a copyright document
		 *
		 * @param {string} copyright
		 * @private
		 */
		_addCopyrightLink: function (copyright) {
			var path = '/' + this.albumInfo.filePath;
			var file = this.albumInfo.copyrightLink;
			var copyrightUrl = Gallery.utility.buildFilesUrl(path, file);
			var copyrightElement = $(copyright);
			copyrightElement.find('a').removeAttr("href");
			copyright = copyrightElement.html();
			var copyrightLink = $('<a>', {
				html: copyright,
				title: t('gallery', 'Link to copyright document'),
				href: copyrightUrl,
				target: "_blank"
			});
			this.infoContentElement.append(copyrightLink);
		}
	};

	Gallery.InfoBox = InfoBox;
})(jQuery, t, Gallery);


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
/* global Handlebars, Gallery, Thumbnails */
(function ($, _, OC, t, Gallery) {
	"use strict";

	var TEMPLATE_ADDBUTTON = '<a href="#" class="button new"><span class="icon icon-add"></span><span class="hidden-visually">New</span></a>';

	/**
	 * Builds and updates the Gallery view
	 *
	 * @constructor
	 */
	var View = function () {
		this.element = $('#gallery');
		this.loadVisibleRows.loading = false;
		this._setupUploader();
		this.breadcrumb = new Gallery.Breadcrumb();
		this.emptyContentElement = $('#emptycontent');
		this.controlsElement = $('#controls');
	};

	View.prototype = {
		element: null,
		breadcrumb: null,
		requestId: -1,
		emptyContentElement: null,
		controlsElement: null,

		/**
		 * Removes all thumbnails from the view
		 */
		clear: function () {
			this.loadVisibleRows.processing = false;
			this.loadVisibleRows.loading = null;
			// We want to keep all the events
			this.element.children().detach();
			this.showLoading();
		},

		/**
		 * @param {string} path
		 * @returns {boolean}
		 */
		_isValidPath: function(path) {
			var sections = path.split('/');
			for (var i = 0; i < sections.length; i++) {
				if (sections[i] === '..') {
					return false;
				}
			}

			return path.toLowerCase().indexOf(decodeURI('%0a')) === -1 &&
				path.toLowerCase().indexOf(decodeURI('%00')) === -1;
		},

		/**
		 * Populates the view if there are images or albums to show
		 *
		 * @param {string} albumPath
		 * @param {string|undefined} errorMessage
		 */
		init: function (albumPath, errorMessage) {
			// Set path to an empty value if not a valid one
			if(!this._isValidPath(albumPath)) {
				albumPath = '';
			}

			// Only do it when the app is initialised
			if (this.requestId === -1) {
				this._initButtons();
				this._blankUrl();
			}
			if ($.isEmptyObject(Gallery.imageMap)) {
				Gallery.view.showEmptyFolder(albumPath, errorMessage);
			} else {
				this.viewAlbum(albumPath);
			}

			this._setBackgroundColour();
		},

		/**
		 * Starts the slideshow
		 *
		 * @param {string} path
		 * @param {string} albumPath
		 */
		startSlideshow: function (path, albumPath) {
			var album = Gallery.albumMap[albumPath];
			var images = album.images;
			var startImage = Gallery.imageMap[path];
			Gallery.slideShow(images, startImage, false);
		},

		/**
		 * Sets up the controls and starts loading the gallery rows
		 *
		 * @param {string|null} albumPath
		 */
		viewAlbum: function (albumPath) {
			albumPath = albumPath || '';
			if (!Gallery.albumMap[albumPath]) {
				return;
			}

			this.clear();

			if (albumPath !== Gallery.currentAlbum
				|| (albumPath === Gallery.currentAlbum &&
				Gallery.albumMap[albumPath].etag !== Gallery.currentEtag)) {
				Gallery.currentAlbum = albumPath;
				Gallery.currentEtag = Gallery.albumMap[albumPath].etag;
				this._setupButtons(albumPath);
			}

			Gallery.albumMap[albumPath].viewedItems = 0;
			Gallery.albumMap[albumPath].preloadOffset = 0;

			// Each request has a unique ID, so that we can track which request a row belongs to
			this.requestId = Math.random();
			Gallery.albumMap[Gallery.currentAlbum].requestId = this.requestId;

			// Loading rows without blocking the execution of the rest of the script
			setTimeout(function () {
				this.loadVisibleRows.activeIndex = 0;
				this.loadVisibleRows(Gallery.albumMap[Gallery.currentAlbum]);
			}.bind(this), 0);
		},

		/**
		 * Manages the sorting interface
		 *
		 * @param {string} sortType name or date
		 * @param {string} sortOrder asc or des
		 */
		sortControlsSetup: function (sortType, sortOrder) {
			var reverseSortType = 'date';
			if (sortType === 'date') {
				reverseSortType = 'name';
			}
			this._setSortButton(sortType, sortOrder, true);
			this._setSortButton(reverseSortType, 'asc', false); // default icon
		},

		/**
		 * Loads and displays gallery rows on screen
		 *
		 * view.loadVisibleRows.loading holds the Promise of a row
		 *
		 * @param {Album} album
		 */
		loadVisibleRows: function (album) {
			var view = this;
			// Wait for the previous request to be completed
			if (this.loadVisibleRows.processing) {
				return;
			}

			/**
			 * At this stage, there is no loading taking place, so we can look for new rows
			 */

			var scroll = $('#content-wrapper').scrollTop() + $(window).scrollTop();
			// 2 windows worth of rows is the limit from which we need to start loading new rows.
			// As we scroll down, it grows
			var targetHeight = ($(window).height() * 2) + scroll;
			// We throttle rows in order to try and not generate too many CSS resizing events at
			// the same time
			var showRows = _.throttle(function (album) {

				// If we've reached the end of the album, we kill the loader
				if (!(album.viewedItems < album.subAlbums.length + album.images.length)) {
					view.loadVisibleRows.processing = false;
					view.loadVisibleRows.loading = null;
					return;
				}

				// Prevents creating rows which are no longer required. I.e when changing album
				if (view.requestId !== album.requestId) {
					return;
				}

				// We can now safely create a new row
				var row = album.getRow($(window).width());
				var rowDom = row.getDom();
				view.element.append(rowDom);

				return album.fillNextRow(row).then(function () {
					if (album.viewedItems < album.subAlbums.length + album.images.length &&
						view.element.height() < targetHeight) {
						return showRows(album);
					}
					// No more rows to load at the moment
					view.loadVisibleRows.processing = false;
					view.loadVisibleRows.loading = null;
				}, function () {
					// Something went wrong, so kill the loader
					view.loadVisibleRows.processing = false;
					view.loadVisibleRows.loading = null;
				});
			}, 100);
			if (this.element.height() < targetHeight) {
				this._showNormal();
				this.loadVisibleRows.processing = true;
				album.requestId = view.requestId;
				this.loadVisibleRows.loading = showRows(album);
			}
		},

		/**
		 * Shows an empty gallery message
		 *
		 * @param {string} albumPath
		 * @param {string|null} errorMessage
		 */
		showEmptyFolder: function (albumPath, errorMessage) {
			var message = '<div class="icon-gallery"></div>';
			var uploadAllowed = true;

			this.element.children().detach();
			this.removeLoading();

			if (!_.isUndefined(errorMessage) && errorMessage !== null) {
				message += '<h2>' + t('gallery',
						'Album cannot be shown') + '</h2>';
				message += '<p>' + escapeHTML(errorMessage) + '</p>';
				uploadAllowed = false;
			} else {
				message += '<h2>' + t('gallery',
						'No media files found') + '</h2>';
				// We can't upload yet on the public side
				if (Gallery.token) {
					message += '<p>' + t('gallery',
							'Upload pictures in the Files app to display them here') + '</p>';
				} else {
					message += '<p>' + t('gallery',
							'Upload new files via drag and drop or by using the [+] button above') +
						'</p>';
				}
			}
			this.emptyContentElement.html(message);
			this.emptyContentElement.removeClass('hidden');

			this._hideButtons(uploadAllowed);
			Gallery.currentAlbum = albumPath;
			var availableWidth = $(window).width() - Gallery.buttonsWidth;
			this.breadcrumb.init(albumPath, availableWidth);
			Gallery.config.albumDesign = null;
		},

		/**
		 * Dims the controls bar when retrieving new content. Matches the effect in Files
		 */
		dimControls: function () {
			// Use the existing mask if its already there
			var $mask = this.controlsElement.find('.mask');
			if ($mask.exists()) {
				return;
			}
			$mask = $('<div class="mask transparent"></div>');
			this.controlsElement.append($mask);
			$mask.removeClass('transparent');
		},

		/**
		 * Shows the infamous loading spinner
		 */
		showLoading: function () {
			this.emptyContentElement.addClass('hidden');
			this.controlsElement.removeClass('hidden');
			$('#content').addClass('icon-loading');
			this.dimControls();
		},

		/**
		 * Removes the spinner in the main area and restore normal visibility of the controls bar
		 */
		removeLoading: function () {
			$('#content').removeClass('icon-loading');
			this.controlsElement.find('.mask').remove();
		},

		/**
		 * Shows thumbnails
		 */
		_showNormal: function () {
			this.emptyContentElement.addClass('hidden');
			this.controlsElement.removeClass('hidden');
			this.removeLoading();
		},

		/**
		 * Sets up our custom handlers for folder uploading operations
		 *
		 * @see OC.Upload.init/file_upload_param.done()
		 *
		 * @private
		 */
		_setupUploader: function () {
			var $uploadEl = $('#file_upload_start');
			if (!$uploadEl.exists()) {
				return;
			}
			this._uploader = new OC.Uploader($uploadEl, {
				fileList: FileList,
				dropZone: $('#content')
			});
			this._uploader.on('add', function (e, data) {
				data.targetDir = '/' + Gallery.currentAlbum;
			});
			this._uploader.on('done', function (e, upload) {
				var data = upload.data;

				// is that the last upload ?
				if (data.files[0] === data.originalFiles[data.originalFiles.length - 1]) {
					var fileList = data.originalFiles;
					//Ask for a refresh of the photowall
					Gallery.getFiles(Gallery.currentAlbum).done(function () {
						var fileId, path;
						// Removes the cached thumbnails of files which have been re-uploaded
						_(fileList).each(function (fileName) {
							path = Gallery.currentAlbum + '/' + fileName;
							if (Gallery.imageMap[path]) {
								fileId = Gallery.imageMap[path].fileId;
								if (Thumbnails.map[fileId]) {
									delete Thumbnails.map[fileId];
								}
							}
						});

						Gallery.view.init(Gallery.currentAlbum);
					});
				}
			});

			// Since Nextcloud 9.0
			if (OC.Uploader) {
				OC.Uploader.prototype._isReceivedSharedFile = function (file) {
					var path = file.name;
					var sharedWith = false;

					if (Gallery.currentAlbum !== '' && Gallery.currentAlbum !== '/') {
						path = Gallery.currentAlbum + '/' + path;
					}
					if (Gallery.imageMap[path] && Gallery.imageMap[path].sharedWithUser) {
						sharedWith = true;
					}

					return sharedWith;
				};
			}
		},

		/**
		 * Adds all the click handlers to buttons the first time they appear in the interface
		 *
		 * @private
		 */
		_initButtons: function () {
			this.element.on("contextmenu", function(e) { e.preventDefault(); });
			$('#filelist-button').click(Gallery.switchToFilesView);
			$('#download').click(Gallery.download);
			$('#shared-button').click(Gallery.share);
			Gallery.infoBox = new Gallery.InfoBox();
			$('#album-info-button').click(Gallery.showInfo);
			$('#sort-name-button').click(Gallery.sorter);
			$('#sort-date-button').click(Gallery.sorter);
			$('#save #save-button').click(Gallery.showSaveForm);
			$('.save-form').submit(Gallery.saveForm);
			this._renderNewButton();
			// Trigger cancelling of file upload
			$('#uploadprogresswrapper .stop').on('click', function () {
				OC.Upload.cancelUploads();
			});
			this.requestId = Math.random();
		},

		/**
		 * Sets up all the buttons of the interface and the breadcrumbs
		 *
		 * @param {string} albumPath
		 * @private
		 */
		_setupButtons: function (albumPath) {
			this._shareButtonSetup(albumPath);
			this._infoButtonSetup();

			var availableWidth = $(window).width() - Gallery.buttonsWidth;
			this.breadcrumb.init(albumPath, availableWidth);
			var album = Gallery.albumMap[albumPath];

			var sum = album.images.length + album.subAlbums.length;
			//If sum of the number of images and subalbums exceeds 1 then show the buttons.
			if(sum > 1)
			{
				$('#sort-name-button').show();
				$('#sort-date-button').show();
			}
			else
			{
				$('#sort-name-button').hide();
				$('#sort-date-button').hide();
			}
			var currentSort = Gallery.config.albumSorting;
			this.sortControlsSetup(currentSort.type, currentSort.order);
			Gallery.albumMap[Gallery.currentAlbum].images.sort(
				Gallery.utility.sortBy(currentSort.type,
					currentSort.order));
			Gallery.albumMap[Gallery.currentAlbum].subAlbums.sort(Gallery.utility.sortBy('name',
				currentSort.albumOrder));

			$('#save-button').show();
			$('#download').show();
			$('a.button.new').show();
		},

		/**
		 * Hide buttons in the controls bar
		 *
		 * @param uploadAllowed
		 */
		_hideButtons: function (uploadAllowed) {
			$('#album-info-button').hide();
			$('#shared-button').hide();
			$('#sort-name-button').hide();
			$('#sort-date-button').hide();
			$('#save-button').hide();
			$('#download').hide();

			if (!uploadAllowed) {
				$('a.button.new').hide();
			}
		},

		/**
		 * Shows or hides the share button depending on if we're in a public gallery or not
		 *
		 * @param {string} albumPath
		 * @private
		 */
		_shareButtonSetup: function (albumPath) {
			var shareButton = $('#shared-button');
			if (albumPath === '' || Gallery.token) {
				shareButton.hide();
			} else {
				shareButton.show();
			}
		},

		/**
		 * Shows or hides the info button based on the information we've received from the server
		 *
		 * @private
		 */
		_infoButtonSetup: function () {
			var infoButton = $('#album-info-button');
			infoButton.find('span').hide();
			var infoContentContainer = $('.album-info-container');
			infoContentContainer.slideUp();
			infoContentContainer.css('max-height',
				$(window).height() - Gallery.browserToolbarHeight);
			var albumInfo = Gallery.config.albumInfo;
			if (Gallery.config.albumError) {
				infoButton.hide();
				var text = '<strong>' + t('gallery', 'Configuration error') + '</strong></br>' +
					Gallery.config.albumError.message + '</br></br>';
				Gallery.utility.showHtmlNotification(text, 7);
			} else if ($.isEmptyObject(albumInfo)) {
				infoButton.hide();
			} else {
				infoButton.show();
				if (albumInfo.inherit !== 'yes' || albumInfo.level === 0) {
					infoButton.find('span').delay(1000).slideDown();
				}
			}
		},

		/**
		 * Sets the background colour of the photowall
		 *
		 * @private
		 */
		_setBackgroundColour: function () {
			var wrapper = $('#content-wrapper');
			var albumDesign = Gallery.config.albumDesign;
			if (!$.isEmptyObject(albumDesign) && albumDesign.background) {
				wrapper.css('background-color', albumDesign.background);
			} else {
				wrapper.css('background-color', '#fff');
			}
		},

		/**
		 * Picks the image which matches the sort order
		 *
		 * @param {string} sortType name or date
		 * @param {string} sortOrder asc or des
		 * @param {boolean} active determines if we're setting up the active sort button
		 * @private
		 */
		_setSortButton: function (sortType, sortOrder, active) {
			var button = $('#sort-' + sortType + '-button');
			// Removing all the classes which control the image in the button
			button.removeClass('active');
			button.find('img').removeClass('front');
			button.find('img').removeClass('back');

			// We need to determine the reverse order in order to send that image to the back
			var reverseSortOrder = 'des';
			if (sortOrder === 'des') {
				reverseSortOrder = 'asc';
			}

			// We assign the proper order to the button images
			button.find('img.' + sortOrder).addClass('front');
			button.find('img.' + reverseSortOrder).addClass('back');

			// The active button needs a hover action for the flip effect
			if (active) {
				button.addClass('active');
				if (button.is(":hover")) {
					button.removeClass('hover');
				}
				// We can't use a toggle here
				button.hover(function () {
						$(this).addClass('hover');
					},
					function () {
						$(this).removeClass('hover');
					});
			}
		},

		/**
		 * If no url is entered then do not show the error box.
		 *
		 */
		_blankUrl: function() {
			$('#remote_address').on("change keyup paste", function() {
 				if ($(this).val() === '') {
 					$('#save-button-confirm').prop('disabled', true);
 				} else {
 					$('#save-button-confirm').prop('disabled', false);
 				}
			});
		},

		/**
		 * Creates the [+] button allowing users who can't drag and drop to upload files
		 *
		 * @see core/apps/files/js/filelist.js
		 * @private
		 */
		_renderNewButton: function () {
			// if no actions container exist, skip
			var $actionsContainer = $('.actions');
			if (!$actionsContainer.length) {
				return;
			}
			if (!this._addButtonTemplate) {
				this._addButtonTemplate = Handlebars.compile(TEMPLATE_ADDBUTTON);
			}
			var $newButton = $(this._addButtonTemplate({
				addText: t('gallery', 'New'),
				iconUrl: OC.imagePath('core', 'actions/add')
			}));

			$actionsContainer.prepend($newButton);
			$newButton.tooltip({'placement': 'bottom'});

			$newButton.click(_.bind(this._onClickNewButton, this));
			this._newButton = $newButton;
		},

		/**
		 * Creates the click handler for the [+] button
		 * @param event
		 * @returns {boolean}
		 *
		 * @see core/apps/files/js/filelist.js
		 * @private
		 */
		_onClickNewButton: function (event) {
			var $target = $(event.target);
			if (!$target.hasClass('.button')) {
				$target = $target.closest('.button');
			}
			this._newButton.tooltip('hide');
			event.preventDefault();
			if ($target.hasClass('disabled')) {
				return false;
			}
			if (!this._newFileMenu) {
				this._newFileMenu = new Gallery.NewFileMenu();
				$('.actions').append(this._newFileMenu.$el);
			}
			this._newFileMenu.showAt($target);

			if (Gallery.currentAlbum === '') {
				$('.menuitem[data-action="hideAlbum"]').parent().hide();
			}
			return false;
		}
	};

	Gallery.View = View;
})(jQuery, _, OC, t, Gallery);


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
/* global Handlebars, Gallery */
(function ($, OC, t, Gallery) {
	"use strict";

	var TEMPLATE =
		'{{#each crumbs}}' +
		'	<div class="crumb {{cssClass}}" data-dir="{{dir}}">' +
		'	{{#if link}}' +
		'		<a href="{{link}}">' +
		'		{{#if img}}' +
		'			{{#with img}}' +
		'			<img title="{{title}}" src="{{imageSrc}}">' +
		'			{{/with}}' +
		'		{{else}}' +
		'			{{name}}' +
		'		{{/if}}' +
		'		</a>' +
		'	{{else}}' +
		'		<span>{{name}}</span>' +
		'	{{/if}}' +
		'	</div>' +
		'{{/each}}';

	/**
	 * Breadcrumbs that represent the path to the current album
	 *
	 * @constructor
	 */
	var Breadcrumb = function () {
		this.breadcrumbsElement = $('#breadcrumbs');
	};

	Breadcrumb.prototype = {
		breadcrumbs: [],
		breadcrumbsElement: null,
		ellipsis: null,
		albumPath: null,
		availableWidth: 0,
		onClick: null,
		droppableOptions: {
			accept: "#gallery > .row > a",
			activeClass: 'breadcrumbs-droppable',
			hoverClass: 'breadcrumbs-droppable-hover',
			tolerance: 'pointer'
		},

		/**
		 * Initialises the breadcrumbs for the current album
		 *
		 * @param {string} albumPath
		 * @param {int} availableWidth
		 */
		init: function (albumPath, availableWidth) {
			this.albumPath = albumPath;
			this.availableWidth = availableWidth;
			this.breadcrumbs = [];
			if (!this._template) {
				this._template = Handlebars.compile(TEMPLATE);
			}
			this._build();
			this._resize(this.availableWidth);
		},

		/**
		 * Defines the maximum available width in which we can build the breadcrumb and resizes it
		 *
		 * @param {int} availableWidth
		 */
		setMaxWidth: function (availableWidth) {
			if (this.availableWidth > availableWidth || this.ellipsis.is(":visible")) {
				this.availableWidth = availableWidth;
				this._resize(this.availableWidth);
			}
		},

		/**
		 * Processes UI elements dropped on the breadcrumbs
		 *
		 * @param event
		 * @param ui
		 */
		onDrop: function (event, ui) {
			var $item = ui.draggable;
			var $clone = ui.helper;
			var $target = $(event.target);
			if (!$target.is('.crumb')) {
				$target = $target.closest('.crumb');
			}
			var targetPath = $(event.target).data('dir').toString();
			var dir = Gallery.currentAlbum;

			while (dir.substr(0, 1) === '/') {//remove extra leading /'s
				dir = dir.substr(1);
			}
			dir = '/' + dir;
			if (dir.substr(-1, 1) !== '/') {
				dir = dir + '/';
			}
			// Do nothing if dragged on current dir
			if (targetPath === dir || targetPath + '/' === dir) {
				return;
			}
			var filePath = $item.data('path').toString();
			var fileName = OC.basename(filePath);

			$clone.fadeOut("normal", function () {
				Gallery.move($item, fileName, filePath, $target, targetPath);
			});
		},

		/**
		 * Shows the dark spinner on the crumb
		 */
		showLoader: function () {
			$(this).addClass("icon-loading-small-dark");
		},

		/**
		 * Builds the breadcrumbs array
		 *
		 * @private
		 */
		_build: function () {
			var i, crumbs, name, path, currentAlbum;
			var albumName = $('#content').data('albumname');
			if (!albumName) {
				albumName = t('gallery', 'Gallery');
			}
			path = '';
			name = '';
			crumbs = this.albumPath.split('/');
			currentAlbum = crumbs.pop();

			// This adds the home button
			this._addHome(albumName, currentAlbum);
			// We always add a hidden ellipsis
			this._pushCrumb('...', '', null, 'ellipsis');

			if (currentAlbum) {
				// This builds the crumbs between home and the current folder
				var crumbsLength = crumbs.length;
				if (crumbsLength > 0) {
					// We add all albums to the breadcrumbs array
					for (i = 0; i < crumbsLength; i++) {
						if (crumbs[i]) {
							name = crumbs[i];
							if (path) {
								path += '/' + crumbs[i];
							} else {
								path += crumbs[i];
							}
							this._pushCrumb(name, path, null, '');
						}
					}
				}
				// We finally push the current folder
				this._pushCrumb(currentAlbum, '', null, 'last');
			}

			this._render();
		},

		/**
		 * Adds the Home button
		 *
		 * @param {string} albumName
		 * @param {string} currentAlbum
		 * @private
		 */
		_addHome: function (albumName, currentAlbum) {
			var crumbImg = {
				imageSrc: OC.imagePath('core', 'places/home'),
				title: albumName
			};
			var cssClass = 'home';
			if (!currentAlbum) {
				cssClass += ' last';
			}

			this._pushCrumb('', '', crumbImg, cssClass);
		},

		/**
		 * Pushes crumb objects to the breadcrumbs array
		 *
		 * @param {string} name
		 * @param {string|boolean} link
		 * @param {Object} img
		 * @param {string} cssClass
		 * @private
		 */
		_pushCrumb: function (name, link, img, cssClass) {
			var hash = '';

			// Prevent the last crumb from getting a link unless the last crumb is 'home'.
			if ( cssClass.indexOf('last') === -1 || cssClass.indexOf('home') > -1 ) {
				hash = '#' + encodeURIComponent(link);
			}

			this.breadcrumbs.push({
				name: name,
				dir: link,
				link: hash,
				img: img,
				cssClass: cssClass
			});
		},

		/**
		 * Renders the full breadcrumb based on crumbs we have collected
		 *
		 * @private
		 */
		_render: function () {
			this.breadcrumbsElement.children().remove();

			var breadcrumbs = this._template({
				crumbs: this.breadcrumbs
			});

			this.breadcrumbsElement.append(breadcrumbs);

			this.droppableOptions.drop = this.onDrop.bind(this);
			this.breadcrumbsElement.find('.crumb:not(.last)').droppable(this.droppableOptions);
		},

		/**
		 * Alters the breadcrumb to make it fit within the asked dimensions
		 *
		 * @param {int} availableWidth
		 *
		 * @private
		 */
		_resize: function (availableWidth) {
			var crumbs = this.breadcrumbsElement.children();
			var shorten = false;
			var ellipsisPath = '';
			var self = this;

			// Hide everything first, so that we can check the width after adding each crumb
			crumbs.hide();

			// We go through the array in reverse order
			var crumbsElement = crumbs.get().reverse();
			$(crumbsElement).each(function () {
				if ($(this).hasClass('home')) {
					$(this).show();
					if (self.breadcrumbs.length > 2) {
						$(this).click(self.showLoader);
					}
					return;
				}
				// 1st sub-album has no-parent and the breadcrumbs contain home, ellipsis and last
				if (self.breadcrumbs.length > 3) {
					$(this).click(self.showLoader);
				}
				if ($(this).hasClass('ellipsis')) {
					self.ellipsis = $(this);
					return;
				}
				if (!shorten) {
					$(this).show();
				}

				// If we've reached the maximum width, we start hiding crumbs
				if (self.breadcrumbsElement.width() > availableWidth) {
					shorten = true;
					$(this).hide();
					if (!ellipsisPath) {
						ellipsisPath = $(this).data('dir');
					}
				}
			});

			// If we had to hide crumbs, we add a way to go to the parent folder
			if (shorten) {
				this.ellipsis.show();

				if (!ellipsisPath) {
					ellipsisPath = OC.dirname(this.albumPath);
				}

				this.ellipsis.children('a').attr('href', '#' + encodeURIComponent(ellipsisPath));
				this.ellipsis.attr('data-original-title', ellipsisPath).tooltip({
					fade: true,
					placement: 'bottom',
					delay: {
						hide: 5
					}
				});
			}
		}
	};

	Gallery.Breadcrumb = Breadcrumb;
})(jQuery, OC, t, Gallery);


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
/* global Handlebars, Gallery, Thumbnails, GalleryImage */
(function ($, Gallery) {
	"use strict";

	var TEMPLATE =
		'<a class="row-element" style="width: {{targetWidth}}px; height: {{targetHeight}}px;" ' +
		'data-width="{{targetWidth}}" data-height="{{targetHeight}}"' +
		'href="{{targetPath}}" data-dir="{{dir}}" data-path="{{path}}"' +
		'data-permissions="{{permissions}}" data-freespace="{{freeSpace}}"' +
		'>' +
		'	<div class="album-loader loading"></div>' +
		'	<span class="album-label">' +
		'		<span class="title">{{label}}</span>' +
		'	</span>' +
		'	<div class="album container" style="width: {{targetWidth}}px; height: {{targetHeight}}px;" >' +
		'	</div>' +
		'</a>';

	/**
	 * Creates a new album object to store information about an album
	 *
	 * @param {string} path
	 * @param {Array<Album|GalleryImage>} subAlbums
	 * @param {Array<Album|GalleryImage>} images
	 * @param {string} name
	 * @param {number} fileId
	 * @param {number} mTime
	 * @param {string} etag
	 * @param {number} size
	 * @param {Boolean} sharedWithUser
	 * @param {string} owner
	 * @param {number} freeSpace
	 * @param {number} permissions
	 * @constructor
	 */
	var Album = function (path, subAlbums, images, name, fileId, mTime, etag, size, sharedWithUser,
						  owner, freeSpace, permissions) {
		this.path = path;
		this.subAlbums = subAlbums;
		this.images = images;
		this.viewedItems = 0;
		this.name = name;
		this.fileId = fileId;
		this.mTime = mTime;
		this.etag = etag;
		this.size = size;
		this.sharedWithUser = sharedWithUser;
		this.owner = owner;
		this.freeSpace = freeSpace;
		this.permissions = permissions;
		this.domDef = null;
		this.loader = null;
		this.preloadOffset = 0;
	};

	Album.prototype = {
		requestId: null,
		droppableOptions: {
			accept: '#gallery > .row > a',
			activeClass: 'album-droppable',
			hoverClass: 'album-droppable-hover',
			tolerance: 'pointer'
		},

		/**
		 * Processes UI elements dropped on the album
		 *
		 * @param event
		 * @param ui
		 */
		onDrop: function (event, ui) {
			var $item = ui.draggable;
			var $clone = ui.helper;
			var $target = $(event.target);
			var targetPath = $target.data('dir').toString();
			var filePath = $item.data('path').toString();
			var fileName = OC.basename(filePath);

			this.loader.show();

			$clone.fadeOut("normal", function () {
				Gallery.move($item, fileName, filePath, $target, targetPath);
			});
		},

		/**
		 * Returns a new album row
		 *
		 * @param {number} width
		 *
		 * @returns {Gallery.Row}
		 */
		getRow: function (width) {
			return new Gallery.Row(width);
		},

		/**
		 * Creates the DOM element for the album and return it immediately so as to not block the
		 * rendering of the rest of the interface
		 *
		 *    * Each album also contains a link to open that folder
		 *    * An album has a natural size of 200x200 and is comprised of 4 thumbnails which have a
		 *        natural size of 200x200
		 *    * Thumbnails are checked first in order to make sure that we have something to show
		 *
		 * @param {number} targetHeight Each row has a specific height
		 *
		 * @return {$} The album to be placed on the row
		 */
		getDom: function (targetHeight) {
			if (this.domDef === null) {
				var template = Handlebars.compile(TEMPLATE);
				var albumElement = template({
					targetHeight: targetHeight,
					targetWidth: targetHeight,
					dir: this.path,
					path: this.path,
					permissions: this.permissions,
					freeSpace: this.freeSpace,
					label: this.name,
					targetPath: '#' + encodeURIComponent(this.path)
				});
				this.domDef = $(albumElement);
				this.loader = this.domDef.children('.album-loader');
				this.loader.hide();
				this.domDef.click(this._openAlbum.bind(this));

				this.droppableOptions.drop = this.onDrop.bind(this);
				this.domDef.droppable(this.droppableOptions);

				// Define a if you don't want to set the style in the template
				//a.width(targetHeight);
				//a.height(targetHeight);

				this._fillSubAlbum(targetHeight);
			} else {
				this.loader.hide();
			}

			return this.domDef;
		},

		/**
		 * Fills the row with albums and images
		 *
		 * @param {Gallery.Row} row The row to append elements to
		 *
		 * @returns {$.Deferred<Gallery.Row>}
		 */
		fillNextRow: function (row) {
			var def = new $.Deferred();
			var numberOfThumbnailsToPreload = 6;
			var buffer = 5;

			/**
			 * Add images to the row until it's full
			 *
			 * @todo The number of images to preload should be a user setting
			 *
			 * @param {Album} album
			 * @param {Row} row
			 * @param {Array<Album|GalleryImage>} images
			 *
			 * @returns {$.Deferred<Gallery.Row>}
			 */
			var addRowElements = function (album, row, images) {
				if ((album.viewedItems + buffer) > album.preloadOffset &&
					(album.preloadOffset < images.length)) {
					album._preload(numberOfThumbnailsToPreload);
				}

				var image = images[album.viewedItems];
				return row.addElement(image).then(function (more) {
					album.viewedItems++;
					if (more && album.viewedItems < images.length) {
						return addRowElements(album, row, images);
					}
					row.fit();
					def.resolve(row);
				});
			};
			var items = this.subAlbums.concat(this.images);
			addRowElements(this, row, items);
			return def.promise();
		},

		/**
		 * Returns IDs of thumbnails belonging to the album
		 *
		 * @param {number} count
		 *
		 * @return number[]
		 */
		getThumbnailIds: function (count) {
			var ids = [];
			var items = this.images.concat(this.subAlbums);
			for (var i = 0; i < items.length && i < count; i++) {
				ids = ids.concat(items[i].getThumbnailIds(count));
			}

			return ids;
		},

		/**
		 * Call when the album is clicked on.
		 *
		 * @param event
		 * @private
		 */
		_openAlbum: function (event) {
			event.stopPropagation();
			// show loading animation
			this.loader.show();
			if(!_.isUndefined(Gallery.Share)){
				Gallery.Share.hideDropDown();
			}
		},

		/**
		 * Retrieves a thumbnail and adds it to the album representation
		 *
		 * Only attaches valid thumbnails to the album
		 *
		 * @param {GalleryImage} image
		 * @param {number} targetHeight Each row has a specific height
		 * @param {number} calcWidth Album width
		 * @param {jQuery} imageHolder
		 *
		 * @returns {$.Deferred<Thumbnail>}
		 * @private
		 */
		_getOneImage: function (image, targetHeight, calcWidth, imageHolder) {
			var backgroundHeight, backgroundWidth;

			backgroundHeight = (targetHeight / 2);
			backgroundWidth = calcWidth - 2.01;

			// Adjust the size because of the margins around pictures
			backgroundHeight -= 2;

			imageHolder.css("height", backgroundHeight)
				.css("width", backgroundWidth);
			var spinner = $('<div class="icon-loading">');
			imageHolder.append(spinner);

			// img is a Thumbnail.image, true means square thumbnails
			return image.getThumbnail(true).then(function (img) {
				if (image.thumbnail.valid) {
					img.alt = '';
					spinner.remove();
					imageHolder.css("background-image", "url('" + img.src + "')")
						.css('opacity', 1);
				}
			});
		},

		/**
		 * Builds the album representation by placing 1 to 4 images on a grid
		 *
		 * @param {Array<GalleryImage>} images
		 * @param {number} targetHeight Each row has a specific height
		 * @param {object} a
		 *
		 * @returns {$.Deferred<Array>}
		 * @private
		 */
		_getFourImages: function (images, targetHeight, a) {
			var calcWidth = targetHeight;
			var targetWidth;
			var imagesCount = images.length;
			var def = new $.Deferred();
			var validImages = [];
			var fail = false;
			var thumbsArray = [];

			for (var i = 0; i < imagesCount; i++) {
				targetWidth = calcWidth;
				// One picture filling the album
				if (imagesCount === 1) {
					targetHeight = 2 * targetHeight;
				}
				// 2 bottom pictures out of 3, or 4 pictures have the size of a quarter of the album
				if ((imagesCount === 3 && i !== 0) || imagesCount === 4) {
					targetWidth = calcWidth / 2;
				}

				// Append the div first in order to not lose the order of images
				var imageHolder = $('<div class="cropped">');
				a.append(imageHolder);
				thumbsArray.push(
					this._getOneImage(images[i], targetHeight, targetWidth, imageHolder));
			}

			// This technique allows us to wait for all objects to be resolved before making a
			// decision
			$.when.apply($, thumbsArray).done(function () {
				for (var i = 0; i < imagesCount; i++) {
					// Collect all valid images, just in case
					if (images[i].thumbnail.valid) {
						validImages.push(images[i]);
					} else {
						fail = true;
					}
				}

				// At least one thumbnail could not be retrieved
				if (fail) {
					// Clean up the album
					a.children().remove();
					// Send back the list of images which have thumbnails
					def.reject(validImages);
				}
			});

			return def.promise();
		},

		/**
		 * Fills the album representation with images we've received
		 *
		 *    * Each album includes between 1 and 4 images
		 *    * Each album is also a link to open that folder
		 *    * An album has a natural size of 200x200 and is comprised of 4 thumbnails which have a
		 * natural size of 200x200 The whole thing gets resized to match the targetHeight
		 *
		 * @param {number} targetHeight
		 * @private
		 */
		_fillSubAlbum: function (targetHeight) {
			var album = this;
			var subAlbum = this.domDef.children('.album');

			if (this.images.length >= 1) {
				this._getFourImages(this.images, targetHeight, subAlbum).fail(
					function (validImages) {
						album.images = validImages;
						album._fillSubAlbum(targetHeight, subAlbum);
					});
			} else {
				var imageHolder = $('<div class="cropped">');
				subAlbum.append(imageHolder);
				this._showFolder(targetHeight, imageHolder);
			}
		},

		/**
		 * Shows a folder icon in the album since we couldn't get any proper thumbnail
		 *
		 * @param {number} targetHeight
		 * @param imageHolder
		 * @private
		 */
		_showFolder: function (targetHeight, imageHolder) {
			var image = new GalleryImage('Generic folder', 'Generic folder', -1, 'image/svg+xml',
				null, null);
			var thumb = Thumbnails.getStandardIcon(-1);
			image.thumbnail = thumb;
			this.images.push(image);
			thumb.loadingDeferred.done(function (img) {
				img.height = (targetHeight - 2);
				img.width = (targetHeight) - 2;
				imageHolder.append(img);
				imageHolder.css('opacity', 1);
			});
		},

		/**
		 * Preloads the first $count thumbnails
		 *
		 * @param {number} count
		 * @private
		 */
		_preload: function (count) {
			var items = this.subAlbums.concat(this.images);
			var realCounter = 0;
			var maxThumbs = 0;
			var fileIds = [];
			var squareFileIds = [];
			for (var i = this.preloadOffset; i < this.preloadOffset + count &&
			i < items.length; i++) {
				if (items[i].subAlbums) {
					maxThumbs = 4;
					var imagesLength = items[i].images.length;
					if (imagesLength > 0 && imagesLength < 4) {
						maxThumbs = imagesLength;
					}
					var squareFileId = items[i].getThumbnailIds(maxThumbs);
					squareFileIds = squareFileIds.concat(squareFileId);
					realCounter = realCounter + maxThumbs;
				} else {
					var fileId = items[i].getThumbnailIds();
					fileIds = fileIds.concat(fileId);
					realCounter++;
				}
				if (realCounter >= count) {
					i++;
					break;
				}
			}

			this.preloadOffset = i;
			Thumbnails.loadBatch(fileIds, false);
			Thumbnails.loadBatch(squareFileIds, true);
		}
	};

	window.Album = Album;
})(jQuery, Gallery);


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
/* global Gallery, Album */
(function ($, Gallery) {
	"use strict";
	/**
	 * Creates a row
	 *
	 * @param {number} targetWidth
	 * @constructor
	 */
	var Row = function (targetWidth) {
		this.targetWidth = targetWidth;
		this.items = [];
		this.width = 4; // 4px margin to start with
		this.domDef = $('<div/>').addClass('row');
	};

	Row.prototype = {
		targetHeight: 200, // standard row height
		draggableOptions: {
			revert: 'invalid',
			revertDuration: 300,
			opacity: 0.7,
			distance: 20,
			zIndex: 1000,
			cursor: 'move',
			helper: function (e) {
				// Capture the original element
				var original = $(e.target).hasClass("ui-draggable") ? $(e.target) : $(
					e.target).closest(".ui-draggable");

				// Create a clone 50% smaller and link it to the #content element
				var clone = original.clone()
					.css({'transform': 'scale(0.5)'})
					.appendTo('#content');

				// Remove the labels
				clone.children('.image-label,.album-label').remove();

				// Centre the mouse pointer
				$(this).draggable("option", "cursorAt", {
					left: Math.floor($(this).width() / 2),
					top: Math.floor($(this).height() / 2)
				});

				return clone;
			},
			start: function (e) {
				// Disable all mouse interactions when dragging
				$('#gallery').css({'pointer-events': 'none'});
				$(e.target).css({opacity: 0.7});
			},
			stop: function (e) { // need to put it back on stop
				$('#gallery').css({'pointer-events': 'all'});
				$(e.target).css({opacity: 1});
			}
		},

		/**
		 * Adds sub-albums and images to the row until it's full
		 *
		 * @param {Album|GalleryImage} element
		 *
		 * @return {jQuery.Deferred<bool>} true if more images can be added to the row
		 */
		addElement: function (element) {
			var row = this;
			var fileNotFoundStatus = 404;
			var def = new $.Deferred();
			var itemDom;

			var validateRowWidth = function (width) {
				row.items.push(element);
				row.width += width + 4; // add 4px for the margin
				def.resolve(!row._isFull());
			};

			itemDom = element.getDom(row.targetHeight);
			row.domDef.append(itemDom);
			itemDom.draggable(this.draggableOptions);

			// The width of an album is always the same as its height
			if (element instanceof Album) {
				validateRowWidth(row.targetHeight);
			} else {
				// We can't calculate the total width if we don't have the width of the thumbnail
				element.getThumbnailWidth(row.targetHeight).then(function (width) {
					if (element.thumbnail.status !== fileNotFoundStatus) {
						element.resize(row.targetHeight, width);
						validateRowWidth(width);
					} else {
						itemDom.remove();
						def.resolve(true);
					}
				}, function () {
					itemDom.remove();
					def.resolve(true);
				});
			}

			return def.promise();
		},

		/**
		 * Returns the DOM element of the row
		 *
		 * @returns {*}
		 */
		getDom: function () {
			return this.domDef;
		},

		/**
		 * Resizes the row once it's full
		 */
		fit: function () {
			var scaleRatio = (this.width > this.targetWidth) ? this.targetWidth / this.width : 1;

			// This animates the elements when the window is resized
			var targetHeight = 4 + (this.targetHeight * scaleRatio);
			targetHeight = targetHeight.toFixed(3);
			this.domDef.height(targetHeight);
			this.domDef.width(this.width * scaleRatio);

			// Resizes and scales all photowall elements to make them fit within the window's width
			this.domDef.find('a').each(function () {
				// Necessary since DOM elements are not resized when CSS transform is used
				$(this).css('width', $(this).data('width') * scaleRatio)
					.css('height', $(this).data('height') * scaleRatio);
				// This scales the containers inside the anchors
				$(this).children('.container').css('transform-origin', 'left top')
					.css('-webkit-transform-origin', 'left top')
					.css('-ms-transform-origin', 'left top')
					.css('transform', 'scale(' + scaleRatio + ')')
					.css('-webkit-transform', 'scale(' + scaleRatio + ')')
					.css('-ms-transform', 'scale(' + scaleRatio + ')');
			});

			// Restore the rows to their normal opacity. This happens immediately with rows
			// containing albums only
			this.domDef.css('opacity', 1);
		},

		/**
		 * Calculates if the row is full
		 *
		 * @returns {boolean}
		 * @private
		 */
		_isFull: function () {
			return this.width > this.targetWidth;
		}
	};

	Gallery.Row = Row;
})(jQuery, Gallery);


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
/* global Handlebars, oc_requesttoken, Gallery, Thumbnails */
(function ($, Gallery, oc_requesttoken) {
	"use strict";

	var TEMPLATE =
		'<a class="row-element" style="width: {{targetWidth}}px; height: {{targetHeight}}px;" ' +
		'href="" data-path="{{path}}">' +
		'	<div class="image-loader loading"></div>' +
		'	<span class="image-label">' +
		'		<span class="title">{{label}}</span>' +
		'	</span>' +
		'	<div class="image container"></div>' +
		'</a>';

	/**
	 * Creates a new image object to store information about a media file
	 *
	 * @param {string} src
	 * @param {string} path
	 * @param {number} fileId
	 * @param {string} mimeType
	 * @param {number} mTime modification time
	 * @param {string} etag
	 * @param {number} size
	 * @param {boolean} sharedWithUser
	 * @param {string} owner
	 * @param {number} permissions
 * @constructor
	 */
	var GalleryImage = function (src, path, fileId, mimeType, mTime, etag, size, sharedWithUser,
								 owner, permissions) {
		this.src = src;
		this.path = path;
		this.fileId = fileId;
		this.mimeType = mimeType;
		this.mTime = mTime;
		this.etag = etag;
		this.size = size;
		this.sharedWithUser = sharedWithUser;
		this.owner = owner;
		this.permissions = permissions;
		this.thumbnail = null;
		this.domDef = null;
		this.spinner = null;
	};

	GalleryImage.prototype = {
		/**
		 * Returns the Thumbnail ID
		 *
		 * @returns {[number]}
		 */
		getThumbnailIds: function () {
			return [this.fileId];
		},

		/**
		 * Returns a reference to a loading Thumbnail.image
		 *
		 * @param {boolean} square
		 *
		 * @returns {jQuery.Deferred<Thumbnail.image>}
		 */
		getThumbnail: function (square) {
			if (this.thumbnail === null) {
				this.thumbnail = Thumbnails.get(this.fileId, square);
			}
			return this.thumbnail.loadingDeferred;
		},

		/**
		 * Returns the width of a thumbnail
		 *
		 * Used to calculate the width of the row as we add more images to it
		 *
		 * @returns {number}
		 */
		getThumbnailWidth: function (targetHeight) {
			var image = this;
			// img is a Thumbnail.image
			return this.getThumbnail(false).then(function (img) {
				var width = 0;
				if (img) {
					// In Firefox, you don't get the size of a SVG before it's added to the DOM
					image.domDef.children('.image').append(img);
					if (image.mimeType === 'image/svg+xml') {
						image.thumbnail.ratio = img.width / img.height;
					}
					width = Math.round(targetHeight * image.thumbnail.ratio);
				}

				return width;
			});
		},

		/**
		 * Creates the container, the a and img elements in the DOM
		 *
		 * Each image is also a link to start the full screen slideshow
		 *
		 * @param {number} targetHeight
		 *
		 * @return {a}
		 */
		getDom: function (targetHeight) {
			if (this.domDef === null) {
				var template = Handlebars.compile(TEMPLATE);
				var imageElement = template({
					targetHeight: targetHeight,
					targetWidth: targetHeight,
					label: OC.basename(this.path),
					path: this.path
				});
				this.domDef = $(imageElement);
				this._addLabel();
				this.spinner = this.domDef.children('.image-loader');
			}
			return this.domDef;
		},

		/**
		 * Resizes the image once it has been loaded
		 *
		 * @param {Number} targetHeight
		 * @param {Number} newWidth
		 */
		resize: function (targetHeight, newWidth) {
			if (this.spinner !== null) {
				var img = this.thumbnail.image;
				this.spinner.remove();
				this.spinner = null;
				this.domDef.attr('data-width', newWidth)
					.attr('data-height', targetHeight);

				var url = this._getLink();
				this.domDef.attr('href', url);

				// This will stretch wide images to make them reach targetHeight
				$(img).css({
					'width': newWidth,
					'height': targetHeight
				});
				img.alt = encodeURI(this.path);

				this.domDef.click(this._openImage.bind(this));
			}
		},

		/**
		 * Adds a label to the album
		 *
		 * @private
		 */
		_addLabel: function () {
			var imageLabel = this.domDef.children('.image-label');
			this.domDef.hover(function () {
				imageLabel.slideToggle(OC.menuSpeed);
			}, function () {
				imageLabel.slideToggle(OC.menuSpeed);
			});
		},

		/**
		 * Generates the link for the click action of the image
		 *
		 * @returns {string}
		 * @private
		 */
		_getLink: function () {
			var url = '#' + encodeURIComponent(this.path);
			if (!this.thumbnail.valid) {
				var params = {
					c: this.etag,
					requesttoken: oc_requesttoken
				};
				url = Gallery.utility.buildGalleryUrl(
					'files',
					'/download/' + this.fileId,
					params
				);
			}

			return url;
		},

		/**
		 * Call when the image is clicked on.
		 *
		 * @param event
		 * @private
		 */
		_openImage: function (event) {
			event.stopPropagation();
			// click function for future use.
		}
	};

	window.GalleryImage = GalleryImage;
})(jQuery, Gallery, oc_requesttoken);


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
/* global $, DOMPurify, OC, Gallery */
/**
 * A thumbnail is the actual image attached to the GalleryImage object
 *
 * @param {number} fileId
 * @param {boolean} square
 * @constructor
 */
function Thumbnail (fileId, square) {
	this.square = square;
	this.fileId = fileId;
	this.image = null;
	this.loadingDeferred = new $.Deferred();
	this.height = 200;
	this.width = 400;
	this.ratio = null;
	this.valid = true;
	this.status = 200;
}

(function ($, OC, Gallery) {
	"use strict";
	var Thumbnails = {
		map: {},
		squareMap: {},

		/**
		 * Retrieves the thumbnail linked to the given fileID
		 *
		 * @param {number} fileId
		 * @param {boolean} square
		 *
		 * @returns {Thumbnail}
		 */
		get: function (fileId, square) {
			var map = {};
			if (square === true) {
				map = Thumbnails.squareMap;
				square = true;
			} else {
				map = Thumbnails.map;
				square = false;
			}
			if (!map[fileId]) {
				map[fileId] = new Thumbnail(fileId, square);
			}

			return map[fileId];
		},

		/**
		 * Returns an icon of a specific type
		 *
		 * -1 is for a folder
		 * -404 is for a broken file icon
		 * -500 is for a media type icon
		 *
		 * @param {number} type
		 *
		 * @returns {Thumbnail}
		 */
		getStandardIcon: function (type) {
			if (!Thumbnails.squareMap[type]) {
				var icon = '';
				// true means square
				var thumb = new Thumbnail(type, true);
				thumb.image = new Image();
				thumb.image.onload = function () {
					thumb.loadingDeferred.resolve(thumb.image);
				};

				if (type === -1) {
					icon = 'filetypes/folder';
				}
				thumb.image.src = OC.imagePath('core', icon);

				Thumbnails.squareMap[type] = thumb;
			}

			return Thumbnails.squareMap[type];
		},

		/**
		 * Loads thumbnails in batch, using EventSource
		 *
		 * @param {Array} ids
		 * @param {boolean} square
		 *
		 * @returns {{}}
		 */
		loadBatch: function (ids, square) {
			var map = (square) ? Thumbnails.squareMap : Thumbnails.map;
			// Prevents re-loading thumbnails when resizing the window
			ids = ids.filter(function (id) {
				return !map[id];
			});
			var batch = {};
			var i, idsLength = ids.length;
			if (idsLength) {
				for (i = 0; i < idsLength; i++) {
					var thumb = new Thumbnail(ids[i], square);
					thumb.image = new Image();
					map[ids[i]] = batch[ids[i]] = thumb;

				}
				var params = {
					ids: ids.join(';'),
					scale: window.devicePixelRatio,
					square: (square) ? 1 : 0
				};
				var url = Gallery.utility.buildGalleryUrl('thumbnails', '', params);

				var eventSource = new Gallery.EventSource(url);
				eventSource.listen('preview',
					function (/**{path, status, mimetype, preview}*/ preview) {
						var id = preview.fileid;
						var thumb = batch[id];
						thumb.status = preview.status;
						if (thumb.status === 404) {
							thumb.valid = false;
							thumb.loadingDeferred.resolve(null);
						} else {
							thumb.image.onload = function () {
								// Fix for SVG files which can come in all sizes
								if (square) {
									thumb.image.width = 200;
									thumb.image.height = 200;
								}
								thumb.ratio = thumb.image.width / thumb.image.height;
								thumb.image.originalWidth = 200 * thumb.ratio;
								thumb.loadingDeferred.resolve(thumb.image);
							};
							thumb.image.onerror = function () {
								thumb.valid = false;
								var icon = OC.MimeType.getIconUrl(preview.mimetype);
								setTimeout(function () {
									thumb.image.src = icon;
								}, 0);
							};

							if (thumb.status === 200) {
								var imageData = preview.preview;
								if (preview.mimetype === 'image/svg+xml') {
									imageData = Thumbnails._purifySvg(imageData);
								}
								thumb.image.src =
									'data:' + preview.mimetype + ';base64,' + imageData;
							} else {
								thumb.valid = false;
								thumb.image.src = OC.MimeType.getIconUrl(preview.mimetype);
							}
						}
					});
			}

			return batch;
		},

		/**
		 * Sanitises SVGs
		 *
		 * We also fix a problem which arises when the XML contains comments
		 *
		 * @param imageData
		 * @returns {string|*}
		 * @private
		 */
		_purifySvg: function (imageData) {
			var pureSvg = DOMPurify.sanitize(window.atob(imageData), {ADD_TAGS: ['filter']});
			// Remove XML comment garbage left in the purified data
			var badTag = pureSvg.indexOf(']&gt;');
			var fixedPureSvg = pureSvg.substring(badTag < 0 ? 0 : 5, pureSvg.length);
			imageData = window.btoa(fixedPureSvg);

			return imageData;
		}

	};

	window.Thumbnails = Thumbnails;
})(jQuery, OC, Gallery);


/*
 * EventSource polyfill version 0.9.7
 * Supported by sc AmvTek srl
 * :email: devel@amvtek.com
 *
 * Modified by interfaSys sàrl
 * 	* Supports multiple parallel EventSource
 * 	* Use XMLHttpRequest for IE8/9 - That means no streaming,
 * 		but no need to make the endpoint accept requests from all origins
 */
(function (global) {

	if (global.EventSource && !global._eventSourceImportPrefix) {
		return;
	}

	var evsImportName = (global._eventSourceImportPrefix || '') + "EventSource";

	var EventSource = function (url, options) {

		if (!url || typeof url != 'string') {
			throw new SyntaxError('Not enough arguments');
		}

		this.URL = url;
		this.setOptions(options);
		var evs = this;
		setTimeout(function () {
			evs.poll();
		}, 0);
	};

	EventSource.prototype = {

		CONNECTING: 0,

		OPEN: 1,

		CLOSED: 2,

		defaultOptions: {

			loggingEnabled: false,

			loggingPrefix: "eventsource",

			interval: 500, // milliseconds

			bufferSizeLimit: 256 * 1024, // bytes

			silentTimeout: 300000, // milliseconds

			getArgs: {
				'evs_buffer_size_limit': 256 * 1024
			},

			xhrHeaders: {
				'Accept': 'text/event-stream',
				'Cache-Control': 'no-cache',
				'X-Requested-With': 'XMLHttpRequest'
			}
		},

		setOptions: function (options) {

			var defaults = this.defaultOptions;
			var option;

			// set all default options...
			for (option in defaults) {

				if (defaults.hasOwnProperty(option)) {
					this[option] = defaults[option];
				}
			}

			// override with what is in options
			for (option in options) {

				if (option in defaults && options.hasOwnProperty(option)) {
					this[option] = options[option];
				}
			}

			// if getArgs option is enabled
			// ensure evs_buffer_size_limit corresponds to bufferSizeLimit
			if (this.getArgs && this.bufferSizeLimit) {

				this.getArgs['evs_buffer_size_limit'] = this.bufferSizeLimit;
			}

			// if console is not available, force loggingEnabled to false
			if (typeof console === "undefined" || typeof console.log === "undefined") {

				this.loggingEnabled = false;
			}
		},

		log: function (message) {

			if (this.loggingEnabled) {

				console.log("[" + this.loggingPrefix + "]:" + message);
			}
		},

		poll: function () {

			try {

				if (this.readyState == this.CLOSED) {
					return;
				}
				this.cleanup();
				this.readyState = this.CONNECTING;
				this.cursor = 0;
				this.cache = '';
				this._xhr = new this.XHR(this);
				this.resetNoActivityTimer();

			}
			catch (e) {

				// in an attempt to silence the errors
				this.log('There were errors inside the pool try-catch');
				this.dispatchEvent('error', {
					type: 'error',
					data: e.message
				});
			}
		},

		pollAgain: function (interval) {

			// schedule poll to be called after interval milliseconds
			var evs = this;
			evs.readyState = evs.CONNECTING;
			evs.dispatchEvent('error', {
				type: 'error',
				data: "Reconnecting "
			});
			this._pollTimer = setTimeout(function () {
				evs.poll();
			}, interval || 0);
		},


		cleanup: function () {

			this.log('evs cleaning up');

			if (this._pollTimer) {
				clearInterval(this._pollTimer);
				this._pollTimer = null;
			}

			if (this._noActivityTimer) {
				clearInterval(this._noActivityTimer);
				this._noActivityTimer = null;
			}

			if (this._xhr) {
				this._xhr.abort();
				this._xhr = null;
			}
		},

		resetNoActivityTimer: function () {

			if (this.silentTimeout) {

				if (this._noActivityTimer) {
					clearInterval(this._noActivityTimer);
				}
				var evs = this;
				this._noActivityTimer = setTimeout(
					function () {
						evs.log('Timeout! silentTImeout:' + evs.silentTimeout);
						evs.pollAgain();
					},
					this.silentTimeout
				);
			}
		},

		close: function () {

			this.readyState = this.CLOSED;
			this.log('Closing connection. readyState: ' + this.readyState);
			this.cleanup();
		},

		_onxhrdata: function () {

			var request = this._xhr;
			if (request.isReady() && !request.hasError()) {
				// reset the timer, as we have activity
				this.resetNoActivityTimer();

				// move this EventSource to OPEN state...
				if (this.readyState == this.CONNECTING) {
					this.readyState = this.OPEN;
					this.dispatchEvent('open', {type: 'open'});
				}

				var buffer = request.getBuffer();

				if (buffer.length > this.bufferSizeLimit) {
					this.log('buffer.length > this.bufferSizeLimit');
					this.pollAgain();
				}

				if (this.cursor == 0 && buffer.length > 0) {

					// skip byte order mark \uFEFF character if it starts the stream
					if (buffer.substring(0, 1) == '\uFEFF') {
						this.cursor = 1;
					}
				}

				var lastMessageIndex = this.lastMessageIndex(buffer);
				if (lastMessageIndex[0] >= this.cursor) {

					var newcursor = lastMessageIndex[1];
					var toparse = buffer.substring(this.cursor, newcursor);
					this.parseStream(toparse);
					this.cursor = newcursor;
				}

				// if request is finished, reopen the connection
				if (request.isDone()) {
					this.log('request.isDone(). reopening the connection');
					this.pollAgain(this.interval);
				}
			}
			else if (this.readyState !== this.CLOSED) {

				this.log('this.readyState !== this.CLOSED');
				this.pollAgain(this.interval);

				//MV: Unsure why an error was previously dispatched
			}
		},

		parseStream: function (chunk) {

			// normalize line separators (\r\n,\r,\n) to \n
			// remove white spaces that may precede \n
			chunk = this.cache + this.normalizeToLF(chunk);

			var events = chunk.split('\n\n');

			var i, j, eventType, datas, line, retry;

			for (i = 0; i < (events.length - 1); i++) {

				eventType = 'message';
				datas = [];
				var parts = events[i].split('\n');

				for (j = 0; j < parts.length; j++) {

					line = this.trimWhiteSpace(parts[j]);

					if (line.indexOf('event') == 0) {

						eventType = line.replace(/event:?\s*/, '');
					}
					else if (line.indexOf('retry') == 0) {

						retry = parseInt(line.replace(/retry:?\s*/, ''));
						if (!isNaN(retry)) {
							this.interval = retry;
						}
					}
					else if (line.indexOf('data') == 0) {

						datas.push(line.replace(/data:?\s*/, ''));
					}
					else if (line.indexOf('id:') == 0) {

						this.lastEventId = line.replace(/id:?\s*/, '');
					}
					else if (line.indexOf('id') == 0) { // this resets the id

						this.lastEventId = null;
					}
				}

				if (datas.length) {
					// dispatch a new event
					var event = new MessageEvent(eventType, datas.join('\n'),
						window.location.origin, this.lastEventId);
					this.dispatchEvent(eventType, event);
				}
			}

			this.cache = events[events.length - 1];
		},

		dispatchEvent: function (type, event) {
			var handlers = this['_' + type + 'Handlers'];

			if (handlers) {

				for (var i = 0; i < handlers.length; i++) {
					handlers[i].call(this, event);
				}
			}

			if (this['on' + type]) {
				this['on' + type].call(this, event);
			}

		},

		addEventListener: function (type, handler) {
			if (!this['_' + type + 'Handlers']) {
				this['_' + type + 'Handlers'] = [];
			}

			this['_' + type + 'Handlers'].push(handler);
		},

		removeEventListener: function (type, handler) {
			var handlers = this['_' + type + 'Handlers'];
			if (!handlers) {
				return;
			}
			for (var i = handlers.length - 1; i >= 0; --i) {
				if (handlers[i] === handler) {
					handlers.splice(i, 1);
					break;
				}
			}
		},

		_pollTimer: null,

		_noActivityTimer: null,

		_xhr: null,

		lastEventId: null,

		cache: '',

		cursor: 0,

		onerror: null,

		onmessage: null,

		onopen: null,

		readyState: 0,

		// ===================================================================
		// helpers functions
		// those are attached to prototype to ease reuse and testing...

		urlWithParams: function (baseURL, params) {

			var encodedArgs = [];

			if (params) {

				var key, urlarg;
				var urlize = encodeURIComponent;

				for (key in params) {
					if (params.hasOwnProperty(key)) {
						urlarg = urlize(key) + '=' + urlize(params[key]);
						encodedArgs.push(urlarg);
					}
				}
			}

			if (encodedArgs.length > 0) {

				if (baseURL.indexOf('?') == -1) {
					return baseURL + '?' + encodedArgs.join('&');
				}
				return baseURL + '&' + encodedArgs.join('&');
			}
			return baseURL;
		},

		lastMessageIndex: function (text) {

			var ln2 = text.lastIndexOf('\n\n');
			var lr2 = text.lastIndexOf('\r\r');
			var lrln2 = text.lastIndexOf('\r\n\r\n');

			if (lrln2 > Math.max(ln2, lr2)) {
				return [lrln2, lrln2 + 4];
			}
			return [Math.max(ln2, lr2), Math.max(ln2, lr2) + 2];
		},

		trimWhiteSpace: function (str) {
			// to remove whitespaces left and right of string

			var reTrim = /^(\s|\u00A0)+|(\s|\u00A0)+$/g;
			return str.replace(reTrim, '');
		},

		normalizeToLF: function (str) {

			// replace \r and \r\n with \n
			return str.replace(/\r\n|\r/g, '\n');
		}

	};

	EventSource.isPolyfill = "XHR";

	// EventSource will send request using XMLHttpRequest
	EventSource.prototype.XHR = function (evs) {

		var request = new XMLHttpRequest();
		this._request = request;
		evs._xhr = this;

		// set handlers
		request.onreadystatechange = function () {
			// On old IE, we can only process the data once the request has been completed
			if ((request.readyState > 3 || (!isOldIE() && request.readyState > 1 )) &&
				evs.readyState != evs.CLOSED) {

				if (request.status == 200
					|| (request.status >= 300
					&& request.status < 400)) {
					evs._onxhrdata();
				} else {
					request._failed = true;
					evs.readyState = evs.CLOSED;
					evs.dispatchEvent('error', {
						type: 'error',
						data: "The server responded with " + request.status
					});
					evs.close();
				}
			}
		};

		request.onprogress = function () {
		};

		request.open('GET', evs.urlWithParams(evs.URL, evs.getArgs), true);

		var headers = evs.xhrHeaders; // maybe null
		for (var header in headers) {
			if (headers.hasOwnProperty(header)) {
				request.setRequestHeader(header, headers[header]);
			}
		}
		if (evs.lastEventId) {
			request.setRequestHeader('Last-Event-Id', evs.lastEventId);
		}

		request.send();
	};

	EventSource.prototype.XHR.prototype = {

		useXDomainRequest: false,

		_request: null,

		_failed: false, // true if we have had errors...

		isReady: function () {


			return this._request.readyState >= 2;
		},

		isDone: function () {

			return (this._request.readyState == 4);
		},

		hasError: function () {

			return (this._failed || (this._request.status >= 400));
		},

		getBuffer: function () {

			var rv = '';
			try {
				rv = this._request.responseText || '';
			}
			catch (e) {
			}
			return rv;
		},

		abort: function () {

			if (this._request) {
				this._request.abort();
			}
		}
	};

	function MessageEvent (type, data, origin, lastEventId) {

		this.bubbles = false;
		this.cancelBubble = false;
		this.cancelable = false;
		this.data = data || null;
		this.origin = origin || '';
		this.lastEventId = lastEventId || '';
		this.type = type || 'message';
	}

	function isOldIE () {

		// return true if we are in IE8 or IE9
		return (window.XDomainRequest &&
		(window.XMLHttpRequest && new XMLHttpRequest().responseType === undefined)) ? true : false;
	}

	global[evsImportName] = EventSource;
})(this);


/**
 * Nextcloud - Gallery
 *
 * This file is licensed under the Affero General Public License version 3 or
 * later. See the COPYING file.
 *
 * @author Robin Appelman <icewind1991@gmail.com>
 * @author Olivier Paroz <galleryapps@oparoz.com>
 *
 * @copyright Robin Appelman 2017
 * @copyright Olivier Paroz 2017
 */

/**
 * Wrapper for server side events
 * (http://en.wikipedia.org/wiki/Server-sent_events)
 */

/* global EventSource, oc_requesttoken, Gallery */
(function (oc_requesttoken) {
	"use strict";
	/**
	 * Create a new event source
	 *
	 * Comes from core and is thus not modified too much in order to be able to easily backport
	 * changes in core
	 *
	 * @param {string} src
	 * @param {object} [data] to be send as GET
	 * @constructor
	 */
	var CustomEventSource = function (src, data) {
		var dataStr = '';
		var joinChar;
		this.typelessListeners = [];
		if (data) {
			for (var i = 0, keys = Object.keys(data); i < keys.length; i++) {
				dataStr += keys[i] + '=' + encodeURIComponent(data[keys[i]]) + '&';
			}
		}
		/* jshint camelcase: false */
		dataStr += 'requesttoken=' + encodeURIComponent(oc_requesttoken);
		if (typeof EventSource !== 'undefined') {
			joinChar = '&';
			if (src.indexOf('?') === -1) {
				joinChar = '?';
			}
			var options = {};
			if (EventSource.isPolyfill !== undefined) {
				// 10 thumbnails * 200k per thumbnail
				options.bufferSizeLimit = 10 * 200 * 1024;
				//options.loggingEnabled = true;
			}
			this.source = new EventSource(src + joinChar + dataStr, options);
			this.source.onmessage = function (e) {
				for (var i = 0; i < this.typelessListeners.length; i++) {
					this.typelessListeners[i](JSON.parse(e.data));
				}
			}.bind(this);
			//add close listener
			this.listen('__internal__', function (data) {
				if (data === 'close') {
					this.close();
				}
			}.bind(this));
		}
	};

	CustomEventSource.prototype = {
		typelessListeners: [],

		/**
		 * Listen to a given type of events.
		 *
		 * @param {String} type event type
		 * @param {Function} callback event callback
		 */
		listen: function (type, callback) {
			if (callback && callback.call) {
				if (type) {
					this.source.addEventListener(type, function (e) {
						if (typeof e.data !== 'undefined') {
							callback(JSON.parse(e.data));
						} else {
							callback('');
						}
					}, false);
				} else {
					this.typelessListeners.push(callback);
				}
			}
		},
		/**
		 * Closes this event source.
		 */
		close: function () {
			if (typeof this.source !== 'undefined') {
				this.source.close();
			}
		}
	};

	Gallery.EventSource = CustomEventSource;
})(oc_requesttoken);


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


/* commonmark 0.27 https://github.com/jgm/CommonMark @license BSD3 */
!function(f){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=f();else if("function"==typeof define&&define.amd)define([],f);else{var g;g="undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof self?self:this,g.commonmark=f()}}(function(){return function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a="function"==typeof require&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}for(var i="function"==typeof require&&require,o=0;o<r.length;o++)s(r[o]);return s}({1:[function(require,module,exports){"use strict";function Parser(options){return{doc:new Document,blocks:blocks,blockStarts:blockStarts,tip:this.doc,oldtip:this.doc,currentLine:"",lineNumber:0,offset:0,column:0,nextNonspace:0,nextNonspaceColumn:0,indent:0,indented:!1,blank:!1,partiallyConsumedTab:!1,allClosed:!0,lastMatchedContainer:this.doc,refmap:{},lastLineLength:0,inlineParser:new InlineParser(options),findNextNonspace:findNextNonspace,advanceOffset:advanceOffset,advanceNextNonspace:advanceNextNonspace,addLine:addLine,addChild:addChild,incorporateLine:incorporateLine,finalize:finalize,processInlines:processInlines,closeUnmatchedBlocks:closeUnmatchedBlocks,parse:parse,options:options||{}}}var Node=require("./node"),unescapeString=require("./common").unescapeString,OPENTAG=require("./common").OPENTAG,CLOSETAG=require("./common").CLOSETAG,CODE_INDENT=4,C_TAB=9,C_NEWLINE=10,C_GREATERTHAN=62,C_LESSTHAN=60,C_SPACE=32,C_OPEN_BRACKET=91,InlineParser=require("./inlines"),reHtmlBlockOpen=[/./,/^<(?:script|pre|style)(?:\s|>|$)/i,/^<!--/,/^<[?]/,/^<![A-Z]/,/^<!\[CDATA\[/,/^<[\/]?(?:address|article|aside|base|basefont|blockquote|body|caption|center|col|colgroup|dd|details|dialog|dir|div|dl|dt|fieldset|figcaption|figure|footer|form|frame|frameset|h[123456]|head|header|hr|html|iframe|legend|li|link|main|menu|menuitem|meta|nav|noframes|ol|optgroup|option|p|param|section|source|title|summary|table|tbody|td|tfoot|th|thead|title|tr|track|ul)(?:\s|[\/]?[>]|$)/i,new RegExp("^(?:"+OPENTAG+"|"+CLOSETAG+")\\s*$","i")],reHtmlBlockClose=[/./,/<\/(?:script|pre|style)>/i,/-->/,/\?>/,/>/,/\]\]>/],reThematicBreak=/^(?:(?:\*[ \t]*){3,}|(?:_[ \t]*){3,}|(?:-[ \t]*){3,})[ \t]*$/,reMaybeSpecial=/^[#`~*+_=<>0-9-]/,reNonSpace=/[^ \t\f\v\r\n]/,reBulletListMarker=/^[*+-]/,reOrderedListMarker=/^(\d{1,9})([.)])/,reATXHeadingMarker=/^#{1,6}(?:[ \t]+|$)/,reCodeFence=/^`{3,}(?!.*`)|^~{3,}(?!.*~)/,reClosingCodeFence=/^(?:`{3,}|~{3,})(?= *$)/,reSetextHeadingLine=/^(?:=+|-+)[ \t]*$/,reLineEnding=/\r\n|\n|\r/,isBlank=function(s){return!reNonSpace.test(s)},isSpaceOrTab=function(c){return c===C_SPACE||c===C_TAB},peek=function(ln,pos){return pos<ln.length?ln.charCodeAt(pos):-1},endsWithBlankLine=function(block){for(;block;){if(block._lastLineBlank)return!0;var t=block.type;if("list"!==t&&"item"!==t)break;block=block._lastChild}return!1},addLine=function(){if(this.partiallyConsumedTab){this.offset+=1;var charsToTab=4-this.column%4;this.tip._string_content+=" ".repeat(charsToTab)}this.tip._string_content+=this.currentLine.slice(this.offset)+"\n"},addChild=function(tag,offset){for(;!this.blocks[this.tip.type].canContain(tag);)this.finalize(this.tip,this.lineNumber-1);var column_number=offset+1,newBlock=new Node(tag,[[this.lineNumber,column_number],[0,0]]);return newBlock._string_content="",this.tip.appendChild(newBlock),this.tip=newBlock,newBlock},parseListMarker=function(parser,container){var match,nextc,spacesStartCol,spacesStartOffset,rest=parser.currentLine.slice(parser.nextNonspace),data={type:null,tight:!0,bulletChar:null,start:null,delimiter:null,padding:null,markerOffset:parser.indent};if(match=rest.match(reBulletListMarker))data.type="bullet",data.bulletChar=match[0][0];else{if(!(match=rest.match(reOrderedListMarker))||"paragraph"===container.type&&"1"!==match[1])return null;data.type="ordered",data.start=parseInt(match[1]),data.delimiter=match[2]}if(nextc=peek(parser.currentLine,parser.nextNonspace+match[0].length),nextc!==-1&&nextc!==C_TAB&&nextc!==C_SPACE)return null;if("paragraph"===container.type&&!parser.currentLine.slice(parser.nextNonspace+match[0].length).match(reNonSpace))return null;parser.advanceNextNonspace(),parser.advanceOffset(match[0].length,!0),spacesStartCol=parser.column,spacesStartOffset=parser.offset;do parser.advanceOffset(1,!0),nextc=peek(parser.currentLine,parser.offset);while(parser.column-spacesStartCol<5&&isSpaceOrTab(nextc));var blank_item=peek(parser.currentLine,parser.offset)===-1,spaces_after_marker=parser.column-spacesStartCol;return spaces_after_marker>=5||spaces_after_marker<1||blank_item?(data.padding=match[0].length+1,parser.column=spacesStartCol,parser.offset=spacesStartOffset,isSpaceOrTab(peek(parser.currentLine,parser.offset))&&parser.advanceOffset(1,!0)):data.padding=match[0].length+spaces_after_marker,data},listsMatch=function(list_data,item_data){return list_data.type===item_data.type&&list_data.delimiter===item_data.delimiter&&list_data.bulletChar===item_data.bulletChar},closeUnmatchedBlocks=function(){if(!this.allClosed){for(;this.oldtip!==this.lastMatchedContainer;){var parent=this.oldtip._parent;this.finalize(this.oldtip,this.lineNumber-1),this.oldtip=parent}this.allClosed=!0}},blocks={document:{continue:function(){return 0},finalize:function(){},canContain:function(t){return"item"!==t},acceptsLines:!1},list:{continue:function(){return 0},finalize:function(parser,block){for(var item=block._firstChild;item;){if(endsWithBlankLine(item)&&item._next){block._listData.tight=!1;break}for(var subitem=item._firstChild;subitem;){if(endsWithBlankLine(subitem)&&(item._next||subitem._next)){block._listData.tight=!1;break}subitem=subitem._next}item=item._next}},canContain:function(t){return"item"===t},acceptsLines:!1},block_quote:{continue:function(parser){var ln=parser.currentLine;return parser.indented||peek(ln,parser.nextNonspace)!==C_GREATERTHAN?1:(parser.advanceNextNonspace(),parser.advanceOffset(1,!1),isSpaceOrTab(peek(ln,parser.offset))&&parser.advanceOffset(1,!0),0)},finalize:function(){},canContain:function(t){return"item"!==t},acceptsLines:!1},item:{continue:function(parser,container){if(parser.blank){if(null==container._firstChild)return 1;parser.advanceNextNonspace()}else{if(!(parser.indent>=container._listData.markerOffset+container._listData.padding))return 1;parser.advanceOffset(container._listData.markerOffset+container._listData.padding,!0)}return 0},finalize:function(){},canContain:function(t){return"item"!==t},acceptsLines:!1},heading:{continue:function(){return 1},finalize:function(){},canContain:function(){return!1},acceptsLines:!1},thematic_break:{continue:function(){return 1},finalize:function(){},canContain:function(){return!1},acceptsLines:!1},code_block:{continue:function(parser,container){var ln=parser.currentLine,indent=parser.indent;if(container._isFenced){var match=indent<=3&&ln.charAt(parser.nextNonspace)===container._fenceChar&&ln.slice(parser.nextNonspace).match(reClosingCodeFence);if(match&&match[0].length>=container._fenceLength)return parser.finalize(container,parser.lineNumber),2;for(var i=container._fenceOffset;i>0&&isSpaceOrTab(peek(ln,parser.offset));)parser.advanceOffset(1,!0),i--}else if(indent>=CODE_INDENT)parser.advanceOffset(CODE_INDENT,!0);else{if(!parser.blank)return 1;parser.advanceNextNonspace()}return 0},finalize:function(parser,block){if(block._isFenced){var content=block._string_content,newlinePos=content.indexOf("\n"),firstLine=content.slice(0,newlinePos),rest=content.slice(newlinePos+1);block.info=unescapeString(firstLine.trim()),block._literal=rest}else block._literal=block._string_content.replace(/(\n *)+$/,"\n");block._string_content=null},canContain:function(){return!1},acceptsLines:!0},html_block:{continue:function(parser,container){return!parser.blank||6!==container._htmlBlockType&&7!==container._htmlBlockType?0:1},finalize:function(parser,block){block._literal=block._string_content.replace(/(\n *)+$/,""),block._string_content=null},canContain:function(){return!1},acceptsLines:!0},paragraph:{continue:function(parser){return parser.blank?1:0},finalize:function(parser,block){for(var pos,hasReferenceDefs=!1;peek(block._string_content,0)===C_OPEN_BRACKET&&(pos=parser.inlineParser.parseReference(block._string_content,parser.refmap));)block._string_content=block._string_content.slice(pos),hasReferenceDefs=!0;hasReferenceDefs&&isBlank(block._string_content)&&block.unlink()},canContain:function(){return!1},acceptsLines:!0}},blockStarts=[function(parser){return parser.indented||peek(parser.currentLine,parser.nextNonspace)!==C_GREATERTHAN?0:(parser.advanceNextNonspace(),parser.advanceOffset(1,!1),isSpaceOrTab(peek(parser.currentLine,parser.offset))&&parser.advanceOffset(1,!0),parser.closeUnmatchedBlocks(),parser.addChild("block_quote",parser.nextNonspace),1)},function(parser){var match;if(!parser.indented&&(match=parser.currentLine.slice(parser.nextNonspace).match(reATXHeadingMarker))){parser.advanceNextNonspace(),parser.advanceOffset(match[0].length,!1),parser.closeUnmatchedBlocks();var container=parser.addChild("heading",parser.nextNonspace);return container.level=match[0].trim().length,container._string_content=parser.currentLine.slice(parser.offset).replace(/^ *#+ *$/,"").replace(/ +#+ *$/,""),parser.advanceOffset(parser.currentLine.length-parser.offset),2}return 0},function(parser){var match;if(!parser.indented&&(match=parser.currentLine.slice(parser.nextNonspace).match(reCodeFence))){var fenceLength=match[0].length;parser.closeUnmatchedBlocks();var container=parser.addChild("code_block",parser.nextNonspace);return container._isFenced=!0,container._fenceLength=fenceLength,container._fenceChar=match[0][0],container._fenceOffset=parser.indent,parser.advanceNextNonspace(),parser.advanceOffset(fenceLength,!1),2}return 0},function(parser,container){if(!parser.indented&&peek(parser.currentLine,parser.nextNonspace)===C_LESSTHAN){var blockType,s=parser.currentLine.slice(parser.nextNonspace);for(blockType=1;blockType<=7;blockType++)if(reHtmlBlockOpen[blockType].test(s)&&(blockType<7||"paragraph"!==container.type)){parser.closeUnmatchedBlocks();var b=parser.addChild("html_block",parser.offset);return b._htmlBlockType=blockType,2}}return 0},function(parser,container){var match;if(!parser.indented&&"paragraph"===container.type&&(match=parser.currentLine.slice(parser.nextNonspace).match(reSetextHeadingLine))){parser.closeUnmatchedBlocks();var heading=new Node("heading",container.sourcepos);return heading.level="="===match[0][0]?1:2,heading._string_content=container._string_content,container.insertAfter(heading),container.unlink(),parser.tip=heading,parser.advanceOffset(parser.currentLine.length-parser.offset,!1),2}return 0},function(parser){return!parser.indented&&reThematicBreak.test(parser.currentLine.slice(parser.nextNonspace))?(parser.closeUnmatchedBlocks(),parser.addChild("thematic_break",parser.nextNonspace),parser.advanceOffset(parser.currentLine.length-parser.offset,!1),2):0},function(parser,container){var data;return parser.indented&&"list"!==container.type||!(data=parseListMarker(parser,container))?0:(parser.closeUnmatchedBlocks(),"list"===parser.tip.type&&listsMatch(container._listData,data)||(container=parser.addChild("list",parser.nextNonspace),container._listData=data),container=parser.addChild("item",parser.nextNonspace),container._listData=data,1)},function(parser){return parser.indented&&"paragraph"!==parser.tip.type&&!parser.blank?(parser.advanceOffset(CODE_INDENT,!0),parser.closeUnmatchedBlocks(),parser.addChild("code_block",parser.offset),2):0}],advanceOffset=function(count,columns){for(var charsToTab,charsToAdvance,c,currentLine=this.currentLine;count>0&&(c=currentLine[this.offset]);)"\t"===c?(charsToTab=4-this.column%4,columns?(this.partiallyConsumedTab=charsToTab>count,charsToAdvance=charsToTab>count?count:charsToTab,this.column+=charsToAdvance,this.offset+=this.partiallyConsumedTab?0:1,count-=charsToAdvance):(this.partiallyConsumedTab=!1,this.column+=charsToTab,this.offset+=1,count-=1)):(this.partiallyConsumedTab=!1,this.offset+=1,this.column+=1,count-=1)},advanceNextNonspace=function(){this.offset=this.nextNonspace,this.column=this.nextNonspaceColumn,this.partiallyConsumedTab=!1},findNextNonspace=function(){for(var c,currentLine=this.currentLine,i=this.offset,cols=this.column;""!==(c=currentLine.charAt(i));)if(" "===c)i++,cols++;else{if("\t"!==c)break;i++,cols+=4-cols%4}this.blank="\n"===c||"\r"===c||""===c,this.nextNonspace=i,this.nextNonspaceColumn=cols,this.indent=this.nextNonspaceColumn-this.column,this.indented=this.indent>=CODE_INDENT},incorporateLine=function(ln){var t,all_matched=!0,container=this.doc;this.oldtip=this.tip,this.offset=0,this.column=0,this.blank=!1,this.partiallyConsumedTab=!1,this.lineNumber+=1,ln.indexOf("\0")!==-1&&(ln=ln.replace(/\0/g,"�")),this.currentLine=ln;for(var lastChild;(lastChild=container._lastChild)&&lastChild._open;){switch(container=lastChild,this.findNextNonspace(),this.blocks[container.type].continue(this,container)){case 0:break;case 1:all_matched=!1;break;case 2:return void(this.lastLineLength=ln.length);default:throw"continue returned illegal value, must be 0, 1, or 2"}if(!all_matched){container=container._parent;break}}this.allClosed=container===this.oldtip,this.lastMatchedContainer=container;for(var matchedLeaf="paragraph"!==container.type&&blocks[container.type].acceptsLines,starts=this.blockStarts,startsLen=starts.length;!matchedLeaf;){if(this.findNextNonspace(),!this.indented&&!reMaybeSpecial.test(ln.slice(this.nextNonspace))){this.advanceNextNonspace();break}for(var i=0;i<startsLen;){var res=starts[i](this,container);if(1===res){container=this.tip;break}if(2===res){container=this.tip,matchedLeaf=!0;break}i++}if(i===startsLen){this.advanceNextNonspace();break}}if(this.allClosed||this.blank||"paragraph"!==this.tip.type){this.closeUnmatchedBlocks(),this.blank&&container.lastChild&&(container.lastChild._lastLineBlank=!0),t=container.type;for(var lastLineBlank=this.blank&&!("block_quote"===t||"code_block"===t&&container._isFenced||"item"===t&&!container._firstChild&&container.sourcepos[0][0]===this.lineNumber),cont=container;cont;)cont._lastLineBlank=lastLineBlank,cont=cont._parent;this.blocks[t].acceptsLines?(this.addLine(),"html_block"===t&&container._htmlBlockType>=1&&container._htmlBlockType<=5&&reHtmlBlockClose[container._htmlBlockType].test(this.currentLine.slice(this.offset))&&this.finalize(container,this.lineNumber)):this.offset<ln.length&&!this.blank&&(container=this.addChild("paragraph",this.offset),this.advanceNextNonspace(),this.addLine())}else this.addLine();this.lastLineLength=ln.length},finalize=function(block,lineNumber){var above=block._parent;block._open=!1,block.sourcepos[1]=[lineNumber,this.lastLineLength],this.blocks[block.type].finalize(this,block),this.tip=above},processInlines=function(block){var node,event,t,walker=block.walker();for(this.inlineParser.refmap=this.refmap,this.inlineParser.options=this.options;event=walker.next();)node=event.node,t=node.type,event.entering||"paragraph"!==t&&"heading"!==t||this.inlineParser.parse(node)},Document=function(){var doc=new Node("document",[[1,1],[0,0]]);return doc},parse=function(input){this.doc=new Document,this.tip=this.doc,this.refmap={},this.lineNumber=0,this.lastLineLength=0,this.offset=0,this.column=0,this.lastMatchedContainer=this.doc,this.currentLine="",this.options.time&&console.time("preparing input");var lines=input.split(reLineEnding),len=lines.length;input.charCodeAt(input.length-1)===C_NEWLINE&&(len-=1),this.options.time&&console.timeEnd("preparing input"),this.options.time&&console.time("block parsing");for(var i=0;i<len;i++)this.incorporateLine(lines[i]);for(;this.tip;)this.finalize(this.tip,len);return this.options.time&&console.timeEnd("block parsing"),this.options.time&&console.time("inline parsing"),this.processInlines(this.doc),this.options.time&&console.timeEnd("inline parsing"),this.doc};module.exports=Parser},{"./common":2,"./inlines":5,"./node":6}],2:[function(require,module,exports){"use strict";var encode=require("mdurl/encode"),decode=require("mdurl/decode"),C_BACKSLASH=92,decodeHTML=require("entities").decodeHTML,ENTITY="&(?:#x[a-f0-9]{1,8}|#[0-9]{1,8}|[a-z][a-z0-9]{1,31});",TAGNAME="[A-Za-z][A-Za-z0-9-]*",ATTRIBUTENAME="[a-zA-Z_:][a-zA-Z0-9:._-]*",UNQUOTEDVALUE="[^\"'=<>`\\x00-\\x20]+",SINGLEQUOTEDVALUE="'[^']*'",DOUBLEQUOTEDVALUE='"[^"]*"',ATTRIBUTEVALUE="(?:"+UNQUOTEDVALUE+"|"+SINGLEQUOTEDVALUE+"|"+DOUBLEQUOTEDVALUE+")",ATTRIBUTEVALUESPEC="(?:\\s*=\\s*"+ATTRIBUTEVALUE+")",ATTRIBUTE="(?:\\s+"+ATTRIBUTENAME+ATTRIBUTEVALUESPEC+"?)",OPENTAG="<"+TAGNAME+ATTRIBUTE+"*\\s*/?>",CLOSETAG="</"+TAGNAME+"\\s*[>]",HTMLCOMMENT="<!---->|<!--(?:-?[^>-])(?:-?[^-])*-->",PROCESSINGINSTRUCTION="[<][?].*?[?][>]",DECLARATION="<![A-Z]+\\s+[^>]*>",CDATA="<!\\[CDATA\\[[\\s\\S]*?\\]\\]>",HTMLTAG="(?:"+OPENTAG+"|"+CLOSETAG+"|"+HTMLCOMMENT+"|"+PROCESSINGINSTRUCTION+"|"+DECLARATION+"|"+CDATA+")",reHtmlTag=new RegExp("^"+HTMLTAG,"i"),reBackslashOrAmp=/[\\&]/,ESCAPABLE="[!\"#$%&'()*+,./:;<=>?@[\\\\\\]^_`{|}~-]",reEntityOrEscapedChar=new RegExp("\\\\"+ESCAPABLE+"|"+ENTITY,"gi"),XMLSPECIAL='[&<>"]',reXmlSpecial=new RegExp(XMLSPECIAL,"g"),reXmlSpecialOrEntity=new RegExp(ENTITY+"|"+XMLSPECIAL,"gi"),unescapeChar=function(s){return s.charCodeAt(0)===C_BACKSLASH?s.charAt(1):decodeHTML(s)},unescapeString=function(s){return reBackslashOrAmp.test(s)?s.replace(reEntityOrEscapedChar,unescapeChar):s},normalizeURI=function(uri){try{return encode(decode(uri))}catch(err){return uri}},replaceUnsafeChar=function(s){switch(s){case"&":return"&amp;";case"<":return"&lt;";case">":return"&gt;";case'"':return"&quot;";default:return s}},escapeXml=function(s,preserve_entities){return reXmlSpecial.test(s)?preserve_entities?s.replace(reXmlSpecialOrEntity,replaceUnsafeChar):s.replace(reXmlSpecial,replaceUnsafeChar):s};module.exports={unescapeString:unescapeString,normalizeURI:normalizeURI,escapeXml:escapeXml,reHtmlTag:reHtmlTag,OPENTAG:OPENTAG,CLOSETAG:CLOSETAG,ENTITY:ENTITY,ESCAPABLE:ESCAPABLE}},{entities:11,"mdurl/decode":19,"mdurl/encode":20}],3:[function(require,module,exports){"use strict";if(String.fromCodePoint)module.exports=function(_){try{return String.fromCodePoint(_)}catch(e){if(e instanceof RangeError)return String.fromCharCode(65533);throw e}};else{var stringFromCharCode=String.fromCharCode,floor=Math.floor,fromCodePoint=function(){var highSurrogate,lowSurrogate,MAX_SIZE=16384,codeUnits=[],index=-1,length=arguments.length;if(!length)return"";for(var result="";++index<length;){var codePoint=Number(arguments[index]);if(!isFinite(codePoint)||codePoint<0||codePoint>1114111||floor(codePoint)!==codePoint)return String.fromCharCode(65533);codePoint<=65535?codeUnits.push(codePoint):(codePoint-=65536,highSurrogate=(codePoint>>10)+55296,lowSurrogate=codePoint%1024+56320,codeUnits.push(highSurrogate,lowSurrogate)),(index+1===length||codeUnits.length>MAX_SIZE)&&(result+=stringFromCharCode.apply(null,codeUnits),codeUnits.length=0)}return result};module.exports=fromCodePoint}},{}],4:[function(require,module,exports){"use strict";module.exports.version="0.27.0",module.exports.Node=require("./node"),module.exports.Parser=require("./blocks"),module.exports.HtmlRenderer=require("./render/html"),module.exports.XmlRenderer=require("./xml")},{"./blocks":1,"./node":6,"./render/html":8,"./xml":10}],5:[function(require,module,exports){"use strict";function InlineParser(options){return{subject:"",delimiters:null,brackets:null,pos:0,refmap:{},match:match,peek:peek,spnl:spnl,parseBackticks:parseBackticks,parseBackslash:parseBackslash,parseAutolink:parseAutolink,parseHtmlTag:parseHtmlTag,scanDelims:scanDelims,handleDelim:handleDelim,parseLinkTitle:parseLinkTitle,parseLinkDestination:parseLinkDestination,parseLinkLabel:parseLinkLabel,parseOpenBracket:parseOpenBracket,parseBang:parseBang,parseCloseBracket:parseCloseBracket,addBracket:addBracket,removeBracket:removeBracket,parseEntity:parseEntity,parseString:parseString,parseNewline:parseNewline,parseReference:parseReference,parseInline:parseInline,processEmphasis:processEmphasis,removeDelimiter:removeDelimiter,options:options||{},parse:parseInlines}}var Node=require("./node"),common=require("./common"),normalizeReference=require("./normalize-reference"),normalizeURI=common.normalizeURI,unescapeString=common.unescapeString,fromCodePoint=require("./from-code-point.js"),decodeHTML=require("entities").decodeHTML;require("string.prototype.repeat");var C_NEWLINE=10,C_ASTERISK=42,C_UNDERSCORE=95,C_BACKTICK=96,C_OPEN_BRACKET=91,C_CLOSE_BRACKET=93,C_LESSTHAN=60,C_BANG=33,C_BACKSLASH=92,C_AMPERSAND=38,C_OPEN_PAREN=40,C_CLOSE_PAREN=41,C_COLON=58,C_SINGLEQUOTE=39,C_DOUBLEQUOTE=34,ESCAPABLE=common.ESCAPABLE,ESCAPED_CHAR="\\\\"+ESCAPABLE,REG_CHAR="[^\\\\()\\x00-\\x20]",IN_PARENS_NOSP="\\(("+REG_CHAR+"|"+ESCAPED_CHAR+"|\\\\)*\\)",ENTITY=common.ENTITY,reHtmlTag=common.reHtmlTag,rePunctuation=new RegExp(/[!-#%-\*,-\/:;\?@\[-\]_\{\}\xA1\xA7\xAB\xB6\xB7\xBB\xBF\u037E\u0387\u055A-\u055F\u0589\u058A\u05BE\u05C0\u05C3\u05C6\u05F3\u05F4\u0609\u060A\u060C\u060D\u061B\u061E\u061F\u066A-\u066D\u06D4\u0700-\u070D\u07F7-\u07F9\u0830-\u083E\u085E\u0964\u0965\u0970\u0AF0\u0DF4\u0E4F\u0E5A\u0E5B\u0F04-\u0F12\u0F14\u0F3A-\u0F3D\u0F85\u0FD0-\u0FD4\u0FD9\u0FDA\u104A-\u104F\u10FB\u1360-\u1368\u1400\u166D\u166E\u169B\u169C\u16EB-\u16ED\u1735\u1736\u17D4-\u17D6\u17D8-\u17DA\u1800-\u180A\u1944\u1945\u1A1E\u1A1F\u1AA0-\u1AA6\u1AA8-\u1AAD\u1B5A-\u1B60\u1BFC-\u1BFF\u1C3B-\u1C3F\u1C7E\u1C7F\u1CC0-\u1CC7\u1CD3\u2010-\u2027\u2030-\u2043\u2045-\u2051\u2053-\u205E\u207D\u207E\u208D\u208E\u2308-\u230B\u2329\u232A\u2768-\u2775\u27C5\u27C6\u27E6-\u27EF\u2983-\u2998\u29D8-\u29DB\u29FC\u29FD\u2CF9-\u2CFC\u2CFE\u2CFF\u2D70\u2E00-\u2E2E\u2E30-\u2E42\u3001-\u3003\u3008-\u3011\u3014-\u301F\u3030\u303D\u30A0\u30FB\uA4FE\uA4FF\uA60D-\uA60F\uA673\uA67E\uA6F2-\uA6F7\uA874-\uA877\uA8CE\uA8CF\uA8F8-\uA8FA\uA8FC\uA92E\uA92F\uA95F\uA9C1-\uA9CD\uA9DE\uA9DF\uAA5C-\uAA5F\uAADE\uAADF\uAAF0\uAAF1\uABEB\uFD3E\uFD3F\uFE10-\uFE19\uFE30-\uFE52\uFE54-\uFE61\uFE63\uFE68\uFE6A\uFE6B\uFF01-\uFF03\uFF05-\uFF0A\uFF0C-\uFF0F\uFF1A\uFF1B\uFF1F\uFF20\uFF3B-\uFF3D\uFF3F\uFF5B\uFF5D\uFF5F-\uFF65]|\uD800[\uDD00-\uDD02\uDF9F\uDFD0]|\uD801\uDD6F|\uD802[\uDC57\uDD1F\uDD3F\uDE50-\uDE58\uDE7F\uDEF0-\uDEF6\uDF39-\uDF3F\uDF99-\uDF9C]|\uD804[\uDC47-\uDC4D\uDCBB\uDCBC\uDCBE-\uDCC1\uDD40-\uDD43\uDD74\uDD75\uDDC5-\uDDC9\uDDCD\uDDDB\uDDDD-\uDDDF\uDE38-\uDE3D\uDEA9]|\uD805[\uDCC6\uDDC1-\uDDD7\uDE41-\uDE43\uDF3C-\uDF3E]|\uD809[\uDC70-\uDC74]|\uD81A[\uDE6E\uDE6F\uDEF5\uDF37-\uDF3B\uDF44]|\uD82F\uDC9F|\uD836[\uDE87-\uDE8B]/),reLinkTitle=new RegExp('^(?:"('+ESCAPED_CHAR+'|[^"\\x00])*"|\'('+ESCAPED_CHAR+"|[^'\\x00])*'|\\(("+ESCAPED_CHAR+"|[^)\\x00])*\\))"),reLinkDestinationBraces=new RegExp("^(?:[<](?:[^ <>\\t\\n\\\\\\x00]|"+ESCAPED_CHAR+"|\\\\)*[>])"),reLinkDestination=new RegExp("^(?:"+REG_CHAR+"+|"+ESCAPED_CHAR+"|\\\\|"+IN_PARENS_NOSP+")*"),reEscapable=new RegExp("^"+ESCAPABLE),reEntityHere=new RegExp("^"+ENTITY,"i"),reTicks=/`+/,reTicksHere=/^`+/,reEllipses=/\.\.\./g,reDash=/--+/g,reEmailAutolink=/^<([a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*)>/,reAutolink=/^<[A-Za-z][A-Za-z0-9.+-]{1,31}:[^<>\x00-\x20]*>/i,reSpnl=/^ *(?:\n *)?/,reWhitespaceChar=/^[ \t\n\x0b\x0c\x0d]/,reWhitespace=/[ \t\n\x0b\x0c\x0d]+/g,reUnicodeWhitespaceChar=/^\s/,reFinalSpace=/ *$/,reInitialSpace=/^ */,reSpaceAtEndOfLine=/^ *(?:\n|$)/,reLinkLabel=new RegExp("^\\[(?:[^\\\\\\[\\]]|"+ESCAPED_CHAR+"|\\\\){0,1000}\\]"),reMain=/^[^\n`\[\]\\!<&*_'"]+/m,text=function(s){var node=new Node("text");return node._literal=s,node},match=function(re){var m=re.exec(this.subject.slice(this.pos));return null===m?null:(this.pos+=m.index+m[0].length,m[0])},peek=function(){return this.pos<this.subject.length?this.subject.charCodeAt(this.pos):-1},spnl=function(){return this.match(reSpnl),!0},parseBackticks=function(block){var ticks=this.match(reTicksHere);if(null===ticks)return!1;for(var matched,node,afterOpenTicks=this.pos;null!==(matched=this.match(reTicks));)if(matched===ticks)return node=new Node("code"),node._literal=this.subject.slice(afterOpenTicks,this.pos-ticks.length).trim().replace(reWhitespace," "),block.appendChild(node),!0;return this.pos=afterOpenTicks,block.appendChild(text(ticks)),!0},parseBackslash=function(block){var node,subj=this.subject;return this.pos+=1,this.peek()===C_NEWLINE?(this.pos+=1,node=new Node("linebreak"),block.appendChild(node)):reEscapable.test(subj.charAt(this.pos))?(block.appendChild(text(subj.charAt(this.pos))),this.pos+=1):block.appendChild(text("\\")),!0},parseAutolink=function(block){var m,dest,node;return(m=this.match(reEmailAutolink))?(dest=m.slice(1,m.length-1),node=new Node("link"),node._destination=normalizeURI("mailto:"+dest),node._title="",node.appendChild(text(dest)),block.appendChild(node),!0):!!(m=this.match(reAutolink))&&(dest=m.slice(1,m.length-1),node=new Node("link"),node._destination=normalizeURI(dest),node._title="",node.appendChild(text(dest)),block.appendChild(node),!0)},parseHtmlTag=function(block){var m=this.match(reHtmlTag);if(null===m)return!1;var node=new Node("html_inline");return node._literal=m,block.appendChild(node),!0},scanDelims=function(cc){var char_before,char_after,cc_after,left_flanking,right_flanking,can_open,can_close,after_is_whitespace,after_is_punctuation,before_is_whitespace,before_is_punctuation,numdelims=0,startpos=this.pos;if(cc===C_SINGLEQUOTE||cc===C_DOUBLEQUOTE)numdelims++,this.pos++;else for(;this.peek()===cc;)numdelims++,this.pos++;return 0===numdelims?null:(char_before=0===startpos?"\n":this.subject.charAt(startpos-1),cc_after=this.peek(),char_after=cc_after===-1?"\n":fromCodePoint(cc_after),after_is_whitespace=reUnicodeWhitespaceChar.test(char_after),after_is_punctuation=rePunctuation.test(char_after),before_is_whitespace=reUnicodeWhitespaceChar.test(char_before),before_is_punctuation=rePunctuation.test(char_before),left_flanking=!(after_is_whitespace||after_is_punctuation&&!before_is_whitespace&&!before_is_punctuation),right_flanking=!(before_is_whitespace||before_is_punctuation&&!after_is_whitespace&&!after_is_punctuation),cc===C_UNDERSCORE?(can_open=left_flanking&&(!right_flanking||before_is_punctuation),can_close=right_flanking&&(!left_flanking||after_is_punctuation)):cc===C_SINGLEQUOTE||cc===C_DOUBLEQUOTE?(can_open=left_flanking&&!right_flanking,can_close=right_flanking):(can_open=left_flanking,can_close=right_flanking),this.pos=startpos,{numdelims:numdelims,can_open:can_open,can_close:can_close})},handleDelim=function(cc,block){var res=this.scanDelims(cc);if(!res)return!1;var contents,numdelims=res.numdelims,startpos=this.pos;this.pos+=numdelims,contents=cc===C_SINGLEQUOTE?"’":cc===C_DOUBLEQUOTE?"“":this.subject.slice(startpos,this.pos);var node=text(contents);return block.appendChild(node),this.delimiters={cc:cc,numdelims:numdelims,node:node,previous:this.delimiters,next:null,can_open:res.can_open,can_close:res.can_close},null!==this.delimiters.previous&&(this.delimiters.previous.next=this.delimiters),!0},removeDelimiter=function(delim){null!==delim.previous&&(delim.previous.next=delim.next),null===delim.next?this.delimiters=delim.previous:delim.next.previous=delim.previous},removeDelimitersBetween=function(bottom,top){bottom.next!==top&&(bottom.next=top,top.previous=bottom)},processEmphasis=function(stack_bottom){var opener,closer,old_closer,opener_inl,closer_inl,tempstack,use_delims,tmp,next,opener_found,openers_bottom=[],odd_match=!1;for(openers_bottom[C_UNDERSCORE]=stack_bottom,openers_bottom[C_ASTERISK]=stack_bottom,openers_bottom[C_SINGLEQUOTE]=stack_bottom,openers_bottom[C_DOUBLEQUOTE]=stack_bottom,closer=this.delimiters;null!==closer&&closer.previous!==stack_bottom;)closer=closer.previous;for(;null!==closer;){var closercc=closer.cc;if(closer.can_close){for(opener=closer.previous,opener_found=!1;null!==opener&&opener!==stack_bottom&&opener!==openers_bottom[closercc];){if(odd_match=(closer.can_open||opener.can_close)&&(opener.numdelims+closer.numdelims)%3===0,opener.cc===closer.cc&&opener.can_open&&!odd_match){opener_found=!0;break}opener=opener.previous}if(old_closer=closer,closercc===C_ASTERISK||closercc===C_UNDERSCORE)if(opener_found){use_delims=closer.numdelims<3||opener.numdelims<3?closer.numdelims<=opener.numdelims?closer.numdelims:opener.numdelims:closer.numdelims%2===0?2:1,opener_inl=opener.node,closer_inl=closer.node,opener.numdelims-=use_delims,closer.numdelims-=use_delims,opener_inl._literal=opener_inl._literal.slice(0,opener_inl._literal.length-use_delims),closer_inl._literal=closer_inl._literal.slice(0,closer_inl._literal.length-use_delims);var emph=new Node(1===use_delims?"emph":"strong");for(tmp=opener_inl._next;tmp&&tmp!==closer_inl;)next=tmp._next,tmp.unlink(),emph.appendChild(tmp),tmp=next;opener_inl.insertAfter(emph),removeDelimitersBetween(opener,closer),0===opener.numdelims&&(opener_inl.unlink(),this.removeDelimiter(opener)),0===closer.numdelims&&(closer_inl.unlink(),tempstack=closer.next,this.removeDelimiter(closer),closer=tempstack)}else closer=closer.next;else closercc===C_SINGLEQUOTE?(closer.node._literal="’",opener_found&&(opener.node._literal="‘"),closer=closer.next):closercc===C_DOUBLEQUOTE&&(closer.node._literal="”",opener_found&&(opener.node.literal="“"),closer=closer.next);opener_found||odd_match||(openers_bottom[closercc]=old_closer.previous,old_closer.can_open||this.removeDelimiter(old_closer))}else closer=closer.next}for(;null!==this.delimiters&&this.delimiters!==stack_bottom;)this.removeDelimiter(this.delimiters)},parseLinkTitle=function(){var title=this.match(reLinkTitle);return null===title?null:unescapeString(title.substr(1,title.length-2))},parseLinkDestination=function(){var res=this.match(reLinkDestinationBraces);return null===res?(res=this.match(reLinkDestination),null===res?null:normalizeURI(unescapeString(res))):normalizeURI(unescapeString(res.substr(1,res.length-2)))},parseLinkLabel=function(){var m=this.match(reLinkLabel);return null===m||m.length>1001?0:m.length},parseOpenBracket=function(block){var startpos=this.pos;this.pos+=1;var node=text("[");return block.appendChild(node),this.addBracket(node,startpos,!1),!0},parseBang=function(block){var startpos=this.pos;if(this.pos+=1,this.peek()===C_OPEN_BRACKET){this.pos+=1;var node=text("![");block.appendChild(node),this.addBracket(node,startpos+1,!0)}else block.appendChild(text("!"));return!0},parseCloseBracket=function(block){var startpos,is_image,dest,title,reflabel,opener,matched=!1;if(this.pos+=1,startpos=this.pos,opener=this.brackets,null===opener)return block.appendChild(text("]")),!0;if(!opener.active)return block.appendChild(text("]")),this.removeBracket(),!0;is_image=opener.image;var savepos=this.pos;if(this.peek()===C_OPEN_PAREN&&(this.pos++,this.spnl()&&null!==(dest=this.parseLinkDestination())&&this.spnl()&&(reWhitespaceChar.test(this.subject.charAt(this.pos-1))&&(title=this.parseLinkTitle()),!0)&&this.spnl()&&this.peek()===C_CLOSE_PAREN?(this.pos+=1,matched=!0):this.pos=savepos),!matched){var beforelabel=this.pos,n=this.parseLinkLabel();if(n>2?reflabel=this.subject.slice(beforelabel,beforelabel+n):opener.bracketAfter||(reflabel=this.subject.slice(opener.index,startpos)),0===n&&(this.pos=savepos),reflabel){var link=this.refmap[normalizeReference(reflabel)];link&&(dest=link.destination,title=link.title,matched=!0)}}if(matched){var node=new Node(is_image?"image":"link");node._destination=dest,node._title=title||"";var tmp,next;for(tmp=opener.node._next;tmp;)next=tmp._next,tmp.unlink(),node.appendChild(tmp),tmp=next;if(block.appendChild(node),this.processEmphasis(opener.previousDelimiter),this.removeBracket(),opener.node.unlink(),!is_image)for(opener=this.brackets;null!==opener;)opener.image||(opener.active=!1),opener=opener.previous;return!0;
}return this.removeBracket(),this.pos=startpos,block.appendChild(text("]")),!0},addBracket=function(node,index,image){null!==this.brackets&&(this.brackets.bracketAfter=!0),this.brackets={node:node,previous:this.brackets,previousDelimiter:this.delimiters,index:index,image:image,active:!0}},removeBracket=function(){this.brackets=this.brackets.previous},parseEntity=function(block){var m;return!!(m=this.match(reEntityHere))&&(block.appendChild(text(decodeHTML(m))),!0)},parseString=function(block){var m;return!!(m=this.match(reMain))&&(block.appendChild(text(this.options.smart?m.replace(reEllipses,"…").replace(reDash,function(chars){var enCount=0,emCount=0;return chars.length%3===0?emCount=chars.length/3:chars.length%2===0?enCount=chars.length/2:chars.length%3===2?(enCount=1,emCount=(chars.length-2)/3):(enCount=2,emCount=(chars.length-4)/3),"—".repeat(emCount)+"–".repeat(enCount)}):m)),!0)},parseNewline=function(block){this.pos+=1;var lastc=block._lastChild;if(lastc&&"text"===lastc.type&&" "===lastc._literal[lastc._literal.length-1]){var hardbreak=" "===lastc._literal[lastc._literal.length-2];lastc._literal=lastc._literal.replace(reFinalSpace,""),block.appendChild(new Node(hardbreak?"linebreak":"softbreak"))}else block.appendChild(new Node("softbreak"));return this.match(reInitialSpace),!0},parseReference=function(s,refmap){this.subject=s,this.pos=0;var rawlabel,dest,title,matchChars,startpos=this.pos;if(matchChars=this.parseLinkLabel(),0===matchChars)return 0;if(rawlabel=this.subject.substr(0,matchChars),this.peek()!==C_COLON)return this.pos=startpos,0;if(this.pos++,this.spnl(),dest=this.parseLinkDestination(),null===dest||0===dest.length)return this.pos=startpos,0;var beforetitle=this.pos;this.spnl(),title=this.parseLinkTitle(),null===title&&(title="",this.pos=beforetitle);var atLineEnd=!0;if(null===this.match(reSpaceAtEndOfLine)&&(""===title?atLineEnd=!1:(title="",this.pos=beforetitle,atLineEnd=null!==this.match(reSpaceAtEndOfLine))),!atLineEnd)return this.pos=startpos,0;var normlabel=normalizeReference(rawlabel);return""===normlabel?(this.pos=startpos,0):(refmap[normlabel]||(refmap[normlabel]={destination:dest,title:title}),this.pos-startpos)},parseInline=function(block){var res=!1,c=this.peek();if(c===-1)return!1;switch(c){case C_NEWLINE:res=this.parseNewline(block);break;case C_BACKSLASH:res=this.parseBackslash(block);break;case C_BACKTICK:res=this.parseBackticks(block);break;case C_ASTERISK:case C_UNDERSCORE:res=this.handleDelim(c,block);break;case C_SINGLEQUOTE:case C_DOUBLEQUOTE:res=this.options.smart&&this.handleDelim(c,block);break;case C_OPEN_BRACKET:res=this.parseOpenBracket(block);break;case C_BANG:res=this.parseBang(block);break;case C_CLOSE_BRACKET:res=this.parseCloseBracket(block);break;case C_LESSTHAN:res=this.parseAutolink(block)||this.parseHtmlTag(block);break;case C_AMPERSAND:res=this.parseEntity(block);break;default:res=this.parseString(block)}return res||(this.pos+=1,block.appendChild(text(fromCodePoint(c)))),!0},parseInlines=function(block){for(this.subject=block._string_content.trim(),this.pos=0,this.delimiters=null,this.brackets=null;this.parseInline(block););block._string_content=null,this.processEmphasis(null)};module.exports=InlineParser},{"./common":2,"./from-code-point.js":3,"./node":6,"./normalize-reference":7,entities:11,"string.prototype.repeat":21}],6:[function(require,module,exports){"use strict";function isContainer(node){switch(node._type){case"document":case"block_quote":case"list":case"item":case"paragraph":case"heading":case"emph":case"strong":case"link":case"image":case"custom_inline":case"custom_block":return!0;default:return!1}}var resumeAt=function(node,entering){this.current=node,this.entering=entering===!0},next=function(){var cur=this.current,entering=this.entering;if(null===cur)return null;var container=isContainer(cur);return entering&&container?cur._firstChild?(this.current=cur._firstChild,this.entering=!0):this.entering=!1:cur===this.root?this.current=null:null===cur._next?(this.current=cur._parent,this.entering=!1):(this.current=cur._next,this.entering=!0),{entering:entering,node:cur}},NodeWalker=function(root){return{current:root,root:root,entering:!0,next:next,resumeAt:resumeAt}},Node=function(nodeType,sourcepos){this._type=nodeType,this._parent=null,this._firstChild=null,this._lastChild=null,this._prev=null,this._next=null,this._sourcepos=sourcepos,this._lastLineBlank=!1,this._open=!0,this._string_content=null,this._literal=null,this._listData={},this._info=null,this._destination=null,this._title=null,this._isFenced=!1,this._fenceChar=null,this._fenceLength=0,this._fenceOffset=null,this._level=null,this._onEnter=null,this._onExit=null},proto=Node.prototype;Object.defineProperty(proto,"isContainer",{get:function(){return isContainer(this)}}),Object.defineProperty(proto,"type",{get:function(){return this._type}}),Object.defineProperty(proto,"firstChild",{get:function(){return this._firstChild}}),Object.defineProperty(proto,"lastChild",{get:function(){return this._lastChild}}),Object.defineProperty(proto,"next",{get:function(){return this._next}}),Object.defineProperty(proto,"prev",{get:function(){return this._prev}}),Object.defineProperty(proto,"parent",{get:function(){return this._parent}}),Object.defineProperty(proto,"sourcepos",{get:function(){return this._sourcepos}}),Object.defineProperty(proto,"literal",{get:function(){return this._literal},set:function(s){this._literal=s}}),Object.defineProperty(proto,"destination",{get:function(){return this._destination},set:function(s){this._destination=s}}),Object.defineProperty(proto,"title",{get:function(){return this._title},set:function(s){this._title=s}}),Object.defineProperty(proto,"info",{get:function(){return this._info},set:function(s){this._info=s}}),Object.defineProperty(proto,"level",{get:function(){return this._level},set:function(s){this._level=s}}),Object.defineProperty(proto,"listType",{get:function(){return this._listData.type},set:function(t){this._listData.type=t}}),Object.defineProperty(proto,"listTight",{get:function(){return this._listData.tight},set:function(t){this._listData.tight=t}}),Object.defineProperty(proto,"listStart",{get:function(){return this._listData.start},set:function(n){this._listData.start=n}}),Object.defineProperty(proto,"listDelimiter",{get:function(){return this._listData.delimiter},set:function(delim){this._listData.delimiter=delim}}),Object.defineProperty(proto,"onEnter",{get:function(){return this._onEnter},set:function(s){this._onEnter=s}}),Object.defineProperty(proto,"onExit",{get:function(){return this._onExit},set:function(s){this._onExit=s}}),Node.prototype.appendChild=function(child){child.unlink(),child._parent=this,this._lastChild?(this._lastChild._next=child,child._prev=this._lastChild,this._lastChild=child):(this._firstChild=child,this._lastChild=child)},Node.prototype.prependChild=function(child){child.unlink(),child._parent=this,this._firstChild?(this._firstChild._prev=child,child._next=this._firstChild,this._firstChild=child):(this._firstChild=child,this._lastChild=child)},Node.prototype.unlink=function(){this._prev?this._prev._next=this._next:this._parent&&(this._parent._firstChild=this._next),this._next?this._next._prev=this._prev:this._parent&&(this._parent._lastChild=this._prev),this._parent=null,this._next=null,this._prev=null},Node.prototype.insertAfter=function(sibling){sibling.unlink(),sibling._next=this._next,sibling._next&&(sibling._next._prev=sibling),sibling._prev=this,this._next=sibling,sibling._parent=this._parent,sibling._next||(sibling._parent._lastChild=sibling)},Node.prototype.insertBefore=function(sibling){sibling.unlink(),sibling._prev=this._prev,sibling._prev&&(sibling._prev._next=sibling),sibling._next=this,this._prev=sibling,sibling._parent=this._parent,sibling._prev||(sibling._parent._firstChild=sibling)},Node.prototype.walker=function(){var walker=new NodeWalker(this);return walker},module.exports=Node},{}],7:[function(require,module,exports){"use strict";var regex=/[ \t\r\n]+|[A-Z\xB5\xC0-\xD6\xD8-\xDF\u0100\u0102\u0104\u0106\u0108\u010A\u010C\u010E\u0110\u0112\u0114\u0116\u0118\u011A\u011C\u011E\u0120\u0122\u0124\u0126\u0128\u012A\u012C\u012E\u0130\u0132\u0134\u0136\u0139\u013B\u013D\u013F\u0141\u0143\u0145\u0147\u0149\u014A\u014C\u014E\u0150\u0152\u0154\u0156\u0158\u015A\u015C\u015E\u0160\u0162\u0164\u0166\u0168\u016A\u016C\u016E\u0170\u0172\u0174\u0176\u0178\u0179\u017B\u017D\u017F\u0181\u0182\u0184\u0186\u0187\u0189-\u018B\u018E-\u0191\u0193\u0194\u0196-\u0198\u019C\u019D\u019F\u01A0\u01A2\u01A4\u01A6\u01A7\u01A9\u01AC\u01AE\u01AF\u01B1-\u01B3\u01B5\u01B7\u01B8\u01BC\u01C4\u01C5\u01C7\u01C8\u01CA\u01CB\u01CD\u01CF\u01D1\u01D3\u01D5\u01D7\u01D9\u01DB\u01DE\u01E0\u01E2\u01E4\u01E6\u01E8\u01EA\u01EC\u01EE\u01F0-\u01F2\u01F4\u01F6-\u01F8\u01FA\u01FC\u01FE\u0200\u0202\u0204\u0206\u0208\u020A\u020C\u020E\u0210\u0212\u0214\u0216\u0218\u021A\u021C\u021E\u0220\u0222\u0224\u0226\u0228\u022A\u022C\u022E\u0230\u0232\u023A\u023B\u023D\u023E\u0241\u0243-\u0246\u0248\u024A\u024C\u024E\u0345\u0370\u0372\u0376\u037F\u0386\u0388-\u038A\u038C\u038E-\u03A1\u03A3-\u03AB\u03B0\u03C2\u03CF-\u03D1\u03D5\u03D6\u03D8\u03DA\u03DC\u03DE\u03E0\u03E2\u03E4\u03E6\u03E8\u03EA\u03EC\u03EE\u03F0\u03F1\u03F4\u03F5\u03F7\u03F9\u03FA\u03FD-\u042F\u0460\u0462\u0464\u0466\u0468\u046A\u046C\u046E\u0470\u0472\u0474\u0476\u0478\u047A\u047C\u047E\u0480\u048A\u048C\u048E\u0490\u0492\u0494\u0496\u0498\u049A\u049C\u049E\u04A0\u04A2\u04A4\u04A6\u04A8\u04AA\u04AC\u04AE\u04B0\u04B2\u04B4\u04B6\u04B8\u04BA\u04BC\u04BE\u04C0\u04C1\u04C3\u04C5\u04C7\u04C9\u04CB\u04CD\u04D0\u04D2\u04D4\u04D6\u04D8\u04DA\u04DC\u04DE\u04E0\u04E2\u04E4\u04E6\u04E8\u04EA\u04EC\u04EE\u04F0\u04F2\u04F4\u04F6\u04F8\u04FA\u04FC\u04FE\u0500\u0502\u0504\u0506\u0508\u050A\u050C\u050E\u0510\u0512\u0514\u0516\u0518\u051A\u051C\u051E\u0520\u0522\u0524\u0526\u0528\u052A\u052C\u052E\u0531-\u0556\u0587\u10A0-\u10C5\u10C7\u10CD\u1E00\u1E02\u1E04\u1E06\u1E08\u1E0A\u1E0C\u1E0E\u1E10\u1E12\u1E14\u1E16\u1E18\u1E1A\u1E1C\u1E1E\u1E20\u1E22\u1E24\u1E26\u1E28\u1E2A\u1E2C\u1E2E\u1E30\u1E32\u1E34\u1E36\u1E38\u1E3A\u1E3C\u1E3E\u1E40\u1E42\u1E44\u1E46\u1E48\u1E4A\u1E4C\u1E4E\u1E50\u1E52\u1E54\u1E56\u1E58\u1E5A\u1E5C\u1E5E\u1E60\u1E62\u1E64\u1E66\u1E68\u1E6A\u1E6C\u1E6E\u1E70\u1E72\u1E74\u1E76\u1E78\u1E7A\u1E7C\u1E7E\u1E80\u1E82\u1E84\u1E86\u1E88\u1E8A\u1E8C\u1E8E\u1E90\u1E92\u1E94\u1E96-\u1E9B\u1E9E\u1EA0\u1EA2\u1EA4\u1EA6\u1EA8\u1EAA\u1EAC\u1EAE\u1EB0\u1EB2\u1EB4\u1EB6\u1EB8\u1EBA\u1EBC\u1EBE\u1EC0\u1EC2\u1EC4\u1EC6\u1EC8\u1ECA\u1ECC\u1ECE\u1ED0\u1ED2\u1ED4\u1ED6\u1ED8\u1EDA\u1EDC\u1EDE\u1EE0\u1EE2\u1EE4\u1EE6\u1EE8\u1EEA\u1EEC\u1EEE\u1EF0\u1EF2\u1EF4\u1EF6\u1EF8\u1EFA\u1EFC\u1EFE\u1F08-\u1F0F\u1F18-\u1F1D\u1F28-\u1F2F\u1F38-\u1F3F\u1F48-\u1F4D\u1F50\u1F52\u1F54\u1F56\u1F59\u1F5B\u1F5D\u1F5F\u1F68-\u1F6F\u1F80-\u1FAF\u1FB2-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD2\u1FD3\u1FD6-\u1FDB\u1FE2-\u1FE4\u1FE6-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u2126\u212A\u212B\u2132\u2160-\u216F\u2183\u24B6-\u24CF\u2C00-\u2C2E\u2C60\u2C62-\u2C64\u2C67\u2C69\u2C6B\u2C6D-\u2C70\u2C72\u2C75\u2C7E-\u2C80\u2C82\u2C84\u2C86\u2C88\u2C8A\u2C8C\u2C8E\u2C90\u2C92\u2C94\u2C96\u2C98\u2C9A\u2C9C\u2C9E\u2CA0\u2CA2\u2CA4\u2CA6\u2CA8\u2CAA\u2CAC\u2CAE\u2CB0\u2CB2\u2CB4\u2CB6\u2CB8\u2CBA\u2CBC\u2CBE\u2CC0\u2CC2\u2CC4\u2CC6\u2CC8\u2CCA\u2CCC\u2CCE\u2CD0\u2CD2\u2CD4\u2CD6\u2CD8\u2CDA\u2CDC\u2CDE\u2CE0\u2CE2\u2CEB\u2CED\u2CF2\uA640\uA642\uA644\uA646\uA648\uA64A\uA64C\uA64E\uA650\uA652\uA654\uA656\uA658\uA65A\uA65C\uA65E\uA660\uA662\uA664\uA666\uA668\uA66A\uA66C\uA680\uA682\uA684\uA686\uA688\uA68A\uA68C\uA68E\uA690\uA692\uA694\uA696\uA698\uA69A\uA722\uA724\uA726\uA728\uA72A\uA72C\uA72E\uA732\uA734\uA736\uA738\uA73A\uA73C\uA73E\uA740\uA742\uA744\uA746\uA748\uA74A\uA74C\uA74E\uA750\uA752\uA754\uA756\uA758\uA75A\uA75C\uA75E\uA760\uA762\uA764\uA766\uA768\uA76A\uA76C\uA76E\uA779\uA77B\uA77D\uA77E\uA780\uA782\uA784\uA786\uA78B\uA78D\uA790\uA792\uA796\uA798\uA79A\uA79C\uA79E\uA7A0\uA7A2\uA7A4\uA7A6\uA7A8\uA7AA-\uA7AD\uA7B0\uA7B1\uFB00-\uFB06\uFB13-\uFB17\uFF21-\uFF3A]|\uD801[\uDC00-\uDC27]|\uD806[\uDCA0-\uDCBF]/g,map={A:"a",B:"b",C:"c",D:"d",E:"e",F:"f",G:"g",H:"h",I:"i",J:"j",K:"k",L:"l",M:"m",N:"n",O:"o",P:"p",Q:"q",R:"r",S:"s",T:"t",U:"u",V:"v",W:"w",X:"x",Y:"y",Z:"z","µ":"μ","À":"à","Á":"á","Â":"â","Ã":"ã","Ä":"ä","Å":"å","Æ":"æ","Ç":"ç","È":"è","É":"é","Ê":"ê","Ë":"ë","Ì":"ì","Í":"í","Î":"î","Ï":"ï","Ð":"ð","Ñ":"ñ","Ò":"ò","Ó":"ó","Ô":"ô","Õ":"õ","Ö":"ö","Ø":"ø","Ù":"ù","Ú":"ú","Û":"û","Ü":"ü","Ý":"ý","Þ":"þ","Ā":"ā","Ă":"ă","Ą":"ą","Ć":"ć","Ĉ":"ĉ","Ċ":"ċ","Č":"č","Ď":"ď","Đ":"đ","Ē":"ē","Ĕ":"ĕ","Ė":"ė","Ę":"ę","Ě":"ě","Ĝ":"ĝ","Ğ":"ğ","Ġ":"ġ","Ģ":"ģ","Ĥ":"ĥ","Ħ":"ħ","Ĩ":"ĩ","Ī":"ī","Ĭ":"ĭ","Į":"į","Ĳ":"ĳ","Ĵ":"ĵ","Ķ":"ķ","Ĺ":"ĺ","Ļ":"ļ","Ľ":"ľ","Ŀ":"ŀ","Ł":"ł","Ń":"ń","Ņ":"ņ","Ň":"ň","Ŋ":"ŋ","Ō":"ō","Ŏ":"ŏ","Ő":"ő","Œ":"œ","Ŕ":"ŕ","Ŗ":"ŗ","Ř":"ř","Ś":"ś","Ŝ":"ŝ","Ş":"ş","Š":"š","Ţ":"ţ","Ť":"ť","Ŧ":"ŧ","Ũ":"ũ","Ū":"ū","Ŭ":"ŭ","Ů":"ů","Ű":"ű","Ų":"ų","Ŵ":"ŵ","Ŷ":"ŷ","Ÿ":"ÿ","Ź":"ź","Ż":"ż","Ž":"ž","ſ":"s","Ɓ":"ɓ","Ƃ":"ƃ","Ƅ":"ƅ","Ɔ":"ɔ","Ƈ":"ƈ","Ɖ":"ɖ","Ɗ":"ɗ","Ƌ":"ƌ","Ǝ":"ǝ","Ə":"ə","Ɛ":"ɛ","Ƒ":"ƒ","Ɠ":"ɠ","Ɣ":"ɣ","Ɩ":"ɩ","Ɨ":"ɨ","Ƙ":"ƙ","Ɯ":"ɯ","Ɲ":"ɲ","Ɵ":"ɵ","Ơ":"ơ","Ƣ":"ƣ","Ƥ":"ƥ","Ʀ":"ʀ","Ƨ":"ƨ","Ʃ":"ʃ","Ƭ":"ƭ","Ʈ":"ʈ","Ư":"ư","Ʊ":"ʊ","Ʋ":"ʋ","Ƴ":"ƴ","Ƶ":"ƶ","Ʒ":"ʒ","Ƹ":"ƹ","Ƽ":"ƽ","Ǆ":"ǆ","ǅ":"ǆ","Ǉ":"ǉ","ǈ":"ǉ","Ǌ":"ǌ","ǋ":"ǌ","Ǎ":"ǎ","Ǐ":"ǐ","Ǒ":"ǒ","Ǔ":"ǔ","Ǖ":"ǖ","Ǘ":"ǘ","Ǚ":"ǚ","Ǜ":"ǜ","Ǟ":"ǟ","Ǡ":"ǡ","Ǣ":"ǣ","Ǥ":"ǥ","Ǧ":"ǧ","Ǩ":"ǩ","Ǫ":"ǫ","Ǭ":"ǭ","Ǯ":"ǯ","Ǳ":"ǳ","ǲ":"ǳ","Ǵ":"ǵ","Ƕ":"ƕ","Ƿ":"ƿ","Ǹ":"ǹ","Ǻ":"ǻ","Ǽ":"ǽ","Ǿ":"ǿ","Ȁ":"ȁ","Ȃ":"ȃ","Ȅ":"ȅ","Ȇ":"ȇ","Ȉ":"ȉ","Ȋ":"ȋ","Ȍ":"ȍ","Ȏ":"ȏ","Ȑ":"ȑ","Ȓ":"ȓ","Ȕ":"ȕ","Ȗ":"ȗ","Ș":"ș","Ț":"ț","Ȝ":"ȝ","Ȟ":"ȟ","Ƞ":"ƞ","Ȣ":"ȣ","Ȥ":"ȥ","Ȧ":"ȧ","Ȩ":"ȩ","Ȫ":"ȫ","Ȭ":"ȭ","Ȯ":"ȯ","Ȱ":"ȱ","Ȳ":"ȳ","Ⱥ":"ⱥ","Ȼ":"ȼ","Ƚ":"ƚ","Ⱦ":"ⱦ","Ɂ":"ɂ","Ƀ":"ƀ","Ʉ":"ʉ","Ʌ":"ʌ","Ɇ":"ɇ","Ɉ":"ɉ","Ɋ":"ɋ","Ɍ":"ɍ","Ɏ":"ɏ","ͅ":"ι","Ͱ":"ͱ","Ͳ":"ͳ","Ͷ":"ͷ","Ϳ":"ϳ","Ά":"ά","Έ":"έ","Ή":"ή","Ί":"ί","Ό":"ό","Ύ":"ύ","Ώ":"ώ","Α":"α","Β":"β","Γ":"γ","Δ":"δ","Ε":"ε","Ζ":"ζ","Η":"η","Θ":"θ","Ι":"ι","Κ":"κ","Λ":"λ","Μ":"μ","Ν":"ν","Ξ":"ξ","Ο":"ο","Π":"π","Ρ":"ρ","Σ":"σ","Τ":"τ","Υ":"υ","Φ":"φ","Χ":"χ","Ψ":"ψ","Ω":"ω","Ϊ":"ϊ","Ϋ":"ϋ","ς":"σ","Ϗ":"ϗ","ϐ":"β","ϑ":"θ","ϕ":"φ","ϖ":"π","Ϙ":"ϙ","Ϛ":"ϛ","Ϝ":"ϝ","Ϟ":"ϟ","Ϡ":"ϡ","Ϣ":"ϣ","Ϥ":"ϥ","Ϧ":"ϧ","Ϩ":"ϩ","Ϫ":"ϫ","Ϭ":"ϭ","Ϯ":"ϯ","ϰ":"κ","ϱ":"ρ","ϴ":"θ","ϵ":"ε","Ϸ":"ϸ","Ϲ":"ϲ","Ϻ":"ϻ","Ͻ":"ͻ","Ͼ":"ͼ","Ͽ":"ͽ","Ѐ":"ѐ","Ё":"ё","Ђ":"ђ","Ѓ":"ѓ","Є":"є","Ѕ":"ѕ","І":"і","Ї":"ї","Ј":"ј","Љ":"љ","Њ":"њ","Ћ":"ћ","Ќ":"ќ","Ѝ":"ѝ","Ў":"ў","Џ":"џ","А":"а","Б":"б","В":"в","Г":"г","Д":"д","Е":"е","Ж":"ж","З":"з","И":"и","Й":"й","К":"к","Л":"л","М":"м","Н":"н","О":"о","П":"п","Р":"р","С":"с","Т":"т","У":"у","Ф":"ф","Х":"х","Ц":"ц","Ч":"ч","Ш":"ш","Щ":"щ","Ъ":"ъ","Ы":"ы","Ь":"ь","Э":"э","Ю":"ю","Я":"я","Ѡ":"ѡ","Ѣ":"ѣ","Ѥ":"ѥ","Ѧ":"ѧ","Ѩ":"ѩ","Ѫ":"ѫ","Ѭ":"ѭ","Ѯ":"ѯ","Ѱ":"ѱ","Ѳ":"ѳ","Ѵ":"ѵ","Ѷ":"ѷ","Ѹ":"ѹ","Ѻ":"ѻ","Ѽ":"ѽ","Ѿ":"ѿ","Ҁ":"ҁ","Ҋ":"ҋ","Ҍ":"ҍ","Ҏ":"ҏ","Ґ":"ґ","Ғ":"ғ","Ҕ":"ҕ","Җ":"җ","Ҙ":"ҙ","Қ":"қ","Ҝ":"ҝ","Ҟ":"ҟ","Ҡ":"ҡ","Ң":"ң","Ҥ":"ҥ","Ҧ":"ҧ","Ҩ":"ҩ","Ҫ":"ҫ","Ҭ":"ҭ","Ү":"ү","Ұ":"ұ","Ҳ":"ҳ","Ҵ":"ҵ","Ҷ":"ҷ","Ҹ":"ҹ","Һ":"һ","Ҽ":"ҽ","Ҿ":"ҿ","Ӏ":"ӏ","Ӂ":"ӂ","Ӄ":"ӄ","Ӆ":"ӆ","Ӈ":"ӈ","Ӊ":"ӊ","Ӌ":"ӌ","Ӎ":"ӎ","Ӑ":"ӑ","Ӓ":"ӓ","Ӕ":"ӕ","Ӗ":"ӗ","Ә":"ә","Ӛ":"ӛ","Ӝ":"ӝ","Ӟ":"ӟ","Ӡ":"ӡ","Ӣ":"ӣ","Ӥ":"ӥ","Ӧ":"ӧ","Ө":"ө","Ӫ":"ӫ","Ӭ":"ӭ","Ӯ":"ӯ","Ӱ":"ӱ","Ӳ":"ӳ","Ӵ":"ӵ","Ӷ":"ӷ","Ӹ":"ӹ","Ӻ":"ӻ","Ӽ":"ӽ","Ӿ":"ӿ","Ԁ":"ԁ","Ԃ":"ԃ","Ԅ":"ԅ","Ԇ":"ԇ","Ԉ":"ԉ","Ԋ":"ԋ","Ԍ":"ԍ","Ԏ":"ԏ","Ԑ":"ԑ","Ԓ":"ԓ","Ԕ":"ԕ","Ԗ":"ԗ","Ԙ":"ԙ","Ԛ":"ԛ","Ԝ":"ԝ","Ԟ":"ԟ","Ԡ":"ԡ","Ԣ":"ԣ","Ԥ":"ԥ","Ԧ":"ԧ","Ԩ":"ԩ","Ԫ":"ԫ","Ԭ":"ԭ","Ԯ":"ԯ","Ա":"ա","Բ":"բ","Գ":"գ","Դ":"դ","Ե":"ե","Զ":"զ","Է":"է","Ը":"ը","Թ":"թ","Ժ":"ժ","Ի":"ի","Լ":"լ","Խ":"խ","Ծ":"ծ","Կ":"կ","Հ":"հ","Ձ":"ձ","Ղ":"ղ","Ճ":"ճ","Մ":"մ","Յ":"յ","Ն":"ն","Շ":"շ","Ո":"ո","Չ":"չ","Պ":"պ","Ջ":"ջ","Ռ":"ռ","Ս":"ս","Վ":"վ","Տ":"տ","Ր":"ր","Ց":"ց","Ւ":"ւ","Փ":"փ","Ք":"ք","Օ":"օ","Ֆ":"ֆ","Ⴀ":"ⴀ","Ⴁ":"ⴁ","Ⴂ":"ⴂ","Ⴃ":"ⴃ","Ⴄ":"ⴄ","Ⴅ":"ⴅ","Ⴆ":"ⴆ","Ⴇ":"ⴇ","Ⴈ":"ⴈ","Ⴉ":"ⴉ","Ⴊ":"ⴊ","Ⴋ":"ⴋ","Ⴌ":"ⴌ","Ⴍ":"ⴍ","Ⴎ":"ⴎ","Ⴏ":"ⴏ","Ⴐ":"ⴐ","Ⴑ":"ⴑ","Ⴒ":"ⴒ","Ⴓ":"ⴓ","Ⴔ":"ⴔ","Ⴕ":"ⴕ","Ⴖ":"ⴖ","Ⴗ":"ⴗ","Ⴘ":"ⴘ","Ⴙ":"ⴙ","Ⴚ":"ⴚ","Ⴛ":"ⴛ","Ⴜ":"ⴜ","Ⴝ":"ⴝ","Ⴞ":"ⴞ","Ⴟ":"ⴟ","Ⴠ":"ⴠ","Ⴡ":"ⴡ","Ⴢ":"ⴢ","Ⴣ":"ⴣ","Ⴤ":"ⴤ","Ⴥ":"ⴥ","Ⴧ":"ⴧ","Ⴭ":"ⴭ","Ḁ":"ḁ","Ḃ":"ḃ","Ḅ":"ḅ","Ḇ":"ḇ","Ḉ":"ḉ","Ḋ":"ḋ","Ḍ":"ḍ","Ḏ":"ḏ","Ḑ":"ḑ","Ḓ":"ḓ","Ḕ":"ḕ","Ḗ":"ḗ","Ḙ":"ḙ","Ḛ":"ḛ","Ḝ":"ḝ","Ḟ":"ḟ","Ḡ":"ḡ","Ḣ":"ḣ","Ḥ":"ḥ","Ḧ":"ḧ","Ḩ":"ḩ","Ḫ":"ḫ","Ḭ":"ḭ","Ḯ":"ḯ","Ḱ":"ḱ","Ḳ":"ḳ","Ḵ":"ḵ","Ḷ":"ḷ","Ḹ":"ḹ","Ḻ":"ḻ","Ḽ":"ḽ","Ḿ":"ḿ","Ṁ":"ṁ","Ṃ":"ṃ","Ṅ":"ṅ","Ṇ":"ṇ","Ṉ":"ṉ","Ṋ":"ṋ","Ṍ":"ṍ","Ṏ":"ṏ","Ṑ":"ṑ","Ṓ":"ṓ","Ṕ":"ṕ","Ṗ":"ṗ","Ṙ":"ṙ","Ṛ":"ṛ","Ṝ":"ṝ","Ṟ":"ṟ","Ṡ":"ṡ","Ṣ":"ṣ","Ṥ":"ṥ","Ṧ":"ṧ","Ṩ":"ṩ","Ṫ":"ṫ","Ṭ":"ṭ","Ṯ":"ṯ","Ṱ":"ṱ","Ṳ":"ṳ","Ṵ":"ṵ","Ṷ":"ṷ","Ṹ":"ṹ","Ṻ":"ṻ","Ṽ":"ṽ","Ṿ":"ṿ","Ẁ":"ẁ","Ẃ":"ẃ","Ẅ":"ẅ","Ẇ":"ẇ","Ẉ":"ẉ","Ẋ":"ẋ","Ẍ":"ẍ","Ẏ":"ẏ","Ẑ":"ẑ","Ẓ":"ẓ","Ẕ":"ẕ","ẛ":"ṡ","Ạ":"ạ","Ả":"ả","Ấ":"ấ","Ầ":"ầ","Ẩ":"ẩ","Ẫ":"ẫ","Ậ":"ậ","Ắ":"ắ","Ằ":"ằ","Ẳ":"ẳ","Ẵ":"ẵ","Ặ":"ặ","Ẹ":"ẹ","Ẻ":"ẻ","Ẽ":"ẽ","Ế":"ế","Ề":"ề","Ể":"ể","Ễ":"ễ","Ệ":"ệ","Ỉ":"ỉ","Ị":"ị","Ọ":"ọ","Ỏ":"ỏ","Ố":"ố","Ồ":"ồ","Ổ":"ổ","Ỗ":"ỗ","Ộ":"ộ","Ớ":"ớ","Ờ":"ờ","Ở":"ở","Ỡ":"ỡ","Ợ":"ợ","Ụ":"ụ","Ủ":"ủ","Ứ":"ứ","Ừ":"ừ","Ử":"ử","Ữ":"ữ","Ự":"ự","Ỳ":"ỳ","Ỵ":"ỵ","Ỷ":"ỷ","Ỹ":"ỹ","Ỻ":"ỻ","Ỽ":"ỽ","Ỿ":"ỿ","Ἀ":"ἀ","Ἁ":"ἁ","Ἂ":"ἂ","Ἃ":"ἃ","Ἄ":"ἄ","Ἅ":"ἅ","Ἆ":"ἆ","Ἇ":"ἇ","Ἐ":"ἐ","Ἑ":"ἑ","Ἒ":"ἒ","Ἓ":"ἓ","Ἔ":"ἔ","Ἕ":"ἕ","Ἠ":"ἠ","Ἡ":"ἡ","Ἢ":"ἢ","Ἣ":"ἣ","Ἤ":"ἤ","Ἥ":"ἥ","Ἦ":"ἦ","Ἧ":"ἧ","Ἰ":"ἰ","Ἱ":"ἱ","Ἲ":"ἲ","Ἳ":"ἳ","Ἴ":"ἴ","Ἵ":"ἵ","Ἶ":"ἶ","Ἷ":"ἷ","Ὀ":"ὀ","Ὁ":"ὁ","Ὂ":"ὂ","Ὃ":"ὃ","Ὄ":"ὄ","Ὅ":"ὅ","Ὑ":"ὑ","Ὓ":"ὓ","Ὕ":"ὕ","Ὗ":"ὗ","Ὠ":"ὠ","Ὡ":"ὡ","Ὢ":"ὢ","Ὣ":"ὣ","Ὤ":"ὤ","Ὥ":"ὥ","Ὦ":"ὦ","Ὧ":"ὧ","Ᾰ":"ᾰ","Ᾱ":"ᾱ","Ὰ":"ὰ","Ά":"ά","ι":"ι","Ὲ":"ὲ","Έ":"έ","Ὴ":"ὴ","Ή":"ή","Ῐ":"ῐ","Ῑ":"ῑ","Ὶ":"ὶ","Ί":"ί","Ῠ":"ῠ","Ῡ":"ῡ","Ὺ":"ὺ","Ύ":"ύ","Ῥ":"ῥ","Ὸ":"ὸ","Ό":"ό","Ὼ":"ὼ","Ώ":"ώ","Ω":"ω","K":"k","Å":"å","Ⅎ":"ⅎ","Ⅰ":"ⅰ","Ⅱ":"ⅱ","Ⅲ":"ⅲ","Ⅳ":"ⅳ","Ⅴ":"ⅴ","Ⅵ":"ⅵ","Ⅶ":"ⅶ","Ⅷ":"ⅷ","Ⅸ":"ⅸ","Ⅹ":"ⅹ","Ⅺ":"ⅺ","Ⅻ":"ⅻ","Ⅼ":"ⅼ","Ⅽ":"ⅽ","Ⅾ":"ⅾ","Ⅿ":"ⅿ","Ↄ":"ↄ","Ⓐ":"ⓐ","Ⓑ":"ⓑ","Ⓒ":"ⓒ","Ⓓ":"ⓓ","Ⓔ":"ⓔ","Ⓕ":"ⓕ","Ⓖ":"ⓖ","Ⓗ":"ⓗ","Ⓘ":"ⓘ","Ⓙ":"ⓙ","Ⓚ":"ⓚ","Ⓛ":"ⓛ","Ⓜ":"ⓜ","Ⓝ":"ⓝ","Ⓞ":"ⓞ","Ⓟ":"ⓟ","Ⓠ":"ⓠ","Ⓡ":"ⓡ","Ⓢ":"ⓢ","Ⓣ":"ⓣ","Ⓤ":"ⓤ","Ⓥ":"ⓥ","Ⓦ":"ⓦ","Ⓧ":"ⓧ","Ⓨ":"ⓨ","Ⓩ":"ⓩ","Ⰰ":"ⰰ","Ⰱ":"ⰱ","Ⰲ":"ⰲ","Ⰳ":"ⰳ","Ⰴ":"ⰴ","Ⰵ":"ⰵ","Ⰶ":"ⰶ","Ⰷ":"ⰷ","Ⰸ":"ⰸ","Ⰹ":"ⰹ","Ⰺ":"ⰺ","Ⰻ":"ⰻ","Ⰼ":"ⰼ","Ⰽ":"ⰽ","Ⰾ":"ⰾ","Ⰿ":"ⰿ","Ⱀ":"ⱀ","Ⱁ":"ⱁ","Ⱂ":"ⱂ","Ⱃ":"ⱃ","Ⱄ":"ⱄ","Ⱅ":"ⱅ","Ⱆ":"ⱆ","Ⱇ":"ⱇ","Ⱈ":"ⱈ","Ⱉ":"ⱉ","Ⱊ":"ⱊ","Ⱋ":"ⱋ","Ⱌ":"ⱌ","Ⱍ":"ⱍ","Ⱎ":"ⱎ","Ⱏ":"ⱏ","Ⱐ":"ⱐ","Ⱑ":"ⱑ","Ⱒ":"ⱒ","Ⱓ":"ⱓ","Ⱔ":"ⱔ","Ⱕ":"ⱕ","Ⱖ":"ⱖ","Ⱗ":"ⱗ","Ⱘ":"ⱘ","Ⱙ":"ⱙ","Ⱚ":"ⱚ","Ⱛ":"ⱛ","Ⱜ":"ⱜ","Ⱝ":"ⱝ","Ⱞ":"ⱞ","Ⱡ":"ⱡ","Ɫ":"ɫ","Ᵽ":"ᵽ","Ɽ":"ɽ","Ⱨ":"ⱨ","Ⱪ":"ⱪ","Ⱬ":"ⱬ","Ɑ":"ɑ","Ɱ":"ɱ","Ɐ":"ɐ","Ɒ":"ɒ","Ⱳ":"ⱳ","Ⱶ":"ⱶ","Ȿ":"ȿ","Ɀ":"ɀ","Ⲁ":"ⲁ","Ⲃ":"ⲃ","Ⲅ":"ⲅ","Ⲇ":"ⲇ","Ⲉ":"ⲉ","Ⲋ":"ⲋ","Ⲍ":"ⲍ","Ⲏ":"ⲏ","Ⲑ":"ⲑ","Ⲓ":"ⲓ","Ⲕ":"ⲕ","Ⲗ":"ⲗ","Ⲙ":"ⲙ","Ⲛ":"ⲛ","Ⲝ":"ⲝ","Ⲟ":"ⲟ","Ⲡ":"ⲡ","Ⲣ":"ⲣ","Ⲥ":"ⲥ","Ⲧ":"ⲧ","Ⲩ":"ⲩ","Ⲫ":"ⲫ","Ⲭ":"ⲭ","Ⲯ":"ⲯ","Ⲱ":"ⲱ","Ⲳ":"ⲳ","Ⲵ":"ⲵ","Ⲷ":"ⲷ","Ⲹ":"ⲹ","Ⲻ":"ⲻ","Ⲽ":"ⲽ","Ⲿ":"ⲿ","Ⳁ":"ⳁ","Ⳃ":"ⳃ","Ⳅ":"ⳅ","Ⳇ":"ⳇ","Ⳉ":"ⳉ","Ⳋ":"ⳋ","Ⳍ":"ⳍ","Ⳏ":"ⳏ","Ⳑ":"ⳑ","Ⳓ":"ⳓ","Ⳕ":"ⳕ","Ⳗ":"ⳗ","Ⳙ":"ⳙ","Ⳛ":"ⳛ","Ⳝ":"ⳝ","Ⳟ":"ⳟ","Ⳡ":"ⳡ","Ⳣ":"ⳣ","Ⳬ":"ⳬ","Ⳮ":"ⳮ","Ⳳ":"ⳳ","Ꙁ":"ꙁ","Ꙃ":"ꙃ","Ꙅ":"ꙅ","Ꙇ":"ꙇ","Ꙉ":"ꙉ","Ꙋ":"ꙋ","Ꙍ":"ꙍ","Ꙏ":"ꙏ","Ꙑ":"ꙑ","Ꙓ":"ꙓ","Ꙕ":"ꙕ","Ꙗ":"ꙗ","Ꙙ":"ꙙ","Ꙛ":"ꙛ","Ꙝ":"ꙝ","Ꙟ":"ꙟ","Ꙡ":"ꙡ","Ꙣ":"ꙣ","Ꙥ":"ꙥ","Ꙧ":"ꙧ","Ꙩ":"ꙩ","Ꙫ":"ꙫ","Ꙭ":"ꙭ","Ꚁ":"ꚁ","Ꚃ":"ꚃ","Ꚅ":"ꚅ","Ꚇ":"ꚇ","Ꚉ":"ꚉ","Ꚋ":"ꚋ","Ꚍ":"ꚍ","Ꚏ":"ꚏ","Ꚑ":"ꚑ","Ꚓ":"ꚓ","Ꚕ":"ꚕ","Ꚗ":"ꚗ","Ꚙ":"ꚙ","Ꚛ":"ꚛ","Ꜣ":"ꜣ","Ꜥ":"ꜥ","Ꜧ":"ꜧ","Ꜩ":"ꜩ","Ꜫ":"ꜫ","Ꜭ":"ꜭ","Ꜯ":"ꜯ","Ꜳ":"ꜳ","Ꜵ":"ꜵ","Ꜷ":"ꜷ","Ꜹ":"ꜹ","Ꜻ":"ꜻ","Ꜽ":"ꜽ","Ꜿ":"ꜿ","Ꝁ":"ꝁ","Ꝃ":"ꝃ","Ꝅ":"ꝅ","Ꝇ":"ꝇ","Ꝉ":"ꝉ","Ꝋ":"ꝋ","Ꝍ":"ꝍ","Ꝏ":"ꝏ","Ꝑ":"ꝑ","Ꝓ":"ꝓ","Ꝕ":"ꝕ","Ꝗ":"ꝗ","Ꝙ":"ꝙ","Ꝛ":"ꝛ","Ꝝ":"ꝝ","Ꝟ":"ꝟ","Ꝡ":"ꝡ","Ꝣ":"ꝣ","Ꝥ":"ꝥ","Ꝧ":"ꝧ","Ꝩ":"ꝩ","Ꝫ":"ꝫ","Ꝭ":"ꝭ","Ꝯ":"ꝯ","Ꝺ":"ꝺ","Ꝼ":"ꝼ","Ᵹ":"ᵹ","Ꝿ":"ꝿ","Ꞁ":"ꞁ","Ꞃ":"ꞃ","Ꞅ":"ꞅ","Ꞇ":"ꞇ","Ꞌ":"ꞌ","Ɥ":"ɥ","Ꞑ":"ꞑ","Ꞓ":"ꞓ","Ꞗ":"ꞗ","Ꞙ":"ꞙ","Ꞛ":"ꞛ","Ꞝ":"ꞝ","Ꞟ":"ꞟ","Ꞡ":"ꞡ","Ꞣ":"ꞣ","Ꞥ":"ꞥ","Ꞧ":"ꞧ","Ꞩ":"ꞩ","Ɦ":"ɦ","Ɜ":"ɜ","Ɡ":"ɡ","Ɬ":"ɬ","Ʞ":"ʞ","Ʇ":"ʇ","Ａ":"ａ","Ｂ":"ｂ","Ｃ":"ｃ","Ｄ":"ｄ","Ｅ":"ｅ","Ｆ":"ｆ","Ｇ":"ｇ","Ｈ":"ｈ","Ｉ":"ｉ","Ｊ":"ｊ","Ｋ":"ｋ","Ｌ":"ｌ","Ｍ":"ｍ","Ｎ":"ｎ","Ｏ":"ｏ","Ｐ":"ｐ","Ｑ":"ｑ","Ｒ":"ｒ","Ｓ":"ｓ","Ｔ":"ｔ","Ｕ":"ｕ","Ｖ":"ｖ","Ｗ":"ｗ","Ｘ":"ｘ","Ｙ":"ｙ","Ｚ":"ｚ","𐐀":"𐐨","𐐁":"𐐩","𐐂":"𐐪","𐐃":"𐐫","𐐄":"𐐬","𐐅":"𐐭","𐐆":"𐐮","𐐇":"𐐯","𐐈":"𐐰","𐐉":"𐐱","𐐊":"𐐲","𐐋":"𐐳","𐐌":"𐐴","𐐍":"𐐵","𐐎":"𐐶","𐐏":"𐐷","𐐐":"𐐸","𐐑":"𐐹","𐐒":"𐐺","𐐓":"𐐻","𐐔":"𐐼","𐐕":"𐐽","𐐖":"𐐾","𐐗":"𐐿","𐐘":"𐑀","𐐙":"𐑁","𐐚":"𐑂","𐐛":"𐑃","𐐜":"𐑄","𐐝":"𐑅","𐐞":"𐑆","𐐟":"𐑇","𐐠":"𐑈","𐐡":"𐑉","𐐢":"𐑊","𐐣":"𐑋","𐐤":"𐑌","𐐥":"𐑍","𐐦":"𐑎","𐐧":"𐑏","𑢠":"𑣀","𑢡":"𑣁","𑢢":"𑣂","𑢣":"𑣃","𑢤":"𑣄","𑢥":"𑣅","𑢦":"𑣆","𑢧":"𑣇","𑢨":"𑣈","𑢩":"𑣉","𑢪":"𑣊","𑢫":"𑣋","𑢬":"𑣌","𑢭":"𑣍","𑢮":"𑣎","𑢯":"𑣏","𑢰":"𑣐","𑢱":"𑣑","𑢲":"𑣒","𑢳":"𑣓","𑢴":"𑣔","𑢵":"𑣕","𑢶":"𑣖","𑢷":"𑣗","𑢸":"𑣘","𑢹":"𑣙","𑢺":"𑣚","𑢻":"𑣛","𑢼":"𑣜","𑢽":"𑣝","𑢾":"𑣞","𑢿":"𑣟","ß":"ss","İ":"i̇","ŉ":"ʼn","ǰ":"ǰ","ΐ":"ΐ","ΰ":"ΰ","և":"եւ","ẖ":"ẖ","ẗ":"ẗ","ẘ":"ẘ","ẙ":"ẙ","ẚ":"aʾ","ẞ":"ss","ὐ":"ὐ","ὒ":"ὒ","ὔ":"ὔ","ὖ":"ὖ","ᾀ":"ἀι","ᾁ":"ἁι","ᾂ":"ἂι","ᾃ":"ἃι","ᾄ":"ἄι","ᾅ":"ἅι","ᾆ":"ἆι","ᾇ":"ἇι","ᾈ":"ἀι","ᾉ":"ἁι","ᾊ":"ἂι","ᾋ":"ἃι","ᾌ":"ἄι","ᾍ":"ἅι","ᾎ":"ἆι","ᾏ":"ἇι","ᾐ":"ἠι","ᾑ":"ἡι","ᾒ":"ἢι","ᾓ":"ἣι","ᾔ":"ἤι","ᾕ":"ἥι","ᾖ":"ἦι","ᾗ":"ἧι","ᾘ":"ἠι","ᾙ":"ἡι","ᾚ":"ἢι","ᾛ":"ἣι","ᾜ":"ἤι","ᾝ":"ἥι","ᾞ":"ἦι","ᾟ":"ἧι","ᾠ":"ὠι","ᾡ":"ὡι","ᾢ":"ὢι","ᾣ":"ὣι","ᾤ":"ὤι","ᾥ":"ὥι","ᾦ":"ὦι","ᾧ":"ὧι","ᾨ":"ὠι","ᾩ":"ὡι","ᾪ":"ὢι","ᾫ":"ὣι","ᾬ":"ὤι","ᾭ":"ὥι","ᾮ":"ὦι","ᾯ":"ὧι","ᾲ":"ὰι","ᾳ":"αι","ᾴ":"άι","ᾶ":"ᾶ","ᾷ":"ᾶι","ᾼ":"αι","ῂ":"ὴι","ῃ":"ηι","ῄ":"ήι","ῆ":"ῆ","ῇ":"ῆι","ῌ":"ηι","ῒ":"ῒ","ΐ":"ΐ","ῖ":"ῖ","ῗ":"ῗ","ῢ":"ῢ","ΰ":"ΰ","ῤ":"ῤ","ῦ":"ῦ","ῧ":"ῧ","ῲ":"ὼι","ῳ":"ωι","ῴ":"ώι","ῶ":"ῶ","ῷ":"ῶι","ῼ":"ωι","ﬀ":"ff","ﬁ":"fi","ﬂ":"fl","ﬃ":"ffi","ﬄ":"ffl","ﬅ":"st","ﬆ":"st","ﬓ":"մն","ﬔ":"մե","ﬕ":"մի","ﬖ":"վն","ﬗ":"մխ"};module.exports=function(string){return string.slice(1,string.length-1).trim().replace(regex,function($0){return map[$0]||" "})}},{}],8:[function(require,module,exports){"use strict";function tag(name,attrs,selfclosing){if(!(this.disableTags>0)){if(this.buffer+="<"+name,attrs&&attrs.length>0)for(var attrib,i=0;void 0!==(attrib=attrs[i]);)this.buffer+=" "+attrib[0]+'="'+attrib[1]+'"',i++;selfclosing&&(this.buffer+=" /"),this.buffer+=">",this.lastOut=">"}}function HtmlRenderer(options){options=options||{},options.softbreak=options.softbreak||"\n",this.disableTags=0,this.lastOut="\n",this.options=options}function text(node){this.out(node.literal)}function softbreak(){this.lit(this.options.softbreak)}function linebreak(){this.tag("br",[],!0),this.cr()}function link(node,entering){var attrs=this.attrs(node);entering?(this.options.safe&&potentiallyUnsafe(node.destination)||attrs.push(["href",esc(node.destination,!0)]),node.title&&attrs.push(["title",esc(node.title,!0)]),this.tag("a",attrs)):this.tag("/a")}function image(node,entering){entering?(0===this.disableTags&&this.lit(this.options.safe&&potentiallyUnsafe(node.destination)?'<img src="" alt="':'<img src="'+esc(node.destination,!0)+'" alt="'),this.disableTags+=1):(this.disableTags-=1,0===this.disableTags&&(node.title&&this.lit('" title="'+esc(node.title,!0)),this.lit('" />')))}function emph(node,entering){this.tag(entering?"em":"/em")}function strong(node,entering){this.tag(entering?"strong":"/strong")}function paragraph(node,entering){var grandparent=node.parent.parent,attrs=this.attrs(node);null!==grandparent&&"list"===grandparent.type&&grandparent.listTight||(entering?(this.cr(),this.tag("p",attrs)):(this.tag("/p"),this.cr()))}function heading(node,entering){var tagname="h"+node.level,attrs=this.attrs(node);entering?(this.cr(),this.tag(tagname,attrs)):(this.tag("/"+tagname),this.cr())}function code(node){this.tag("code"),this.out(node.literal),this.tag("/code")}function code_block(node){var info_words=node.info?node.info.split(/\s+/):[],attrs=this.attrs(node);info_words.length>0&&info_words[0].length>0&&attrs.push(["class","language-"+esc(info_words[0],!0)]),this.cr(),this.tag("pre"),this.tag("code",attrs),this.out(node.literal),this.tag("/code"),this.tag("/pre"),this.cr()}function thematic_break(node){var attrs=this.attrs(node);this.cr(),this.tag("hr",attrs,!0),this.cr()}function block_quote(node,entering){var attrs=this.attrs(node);entering?(this.cr(),this.tag("blockquote",attrs),this.cr()):(this.cr(),this.tag("/blockquote"),this.cr())}function list(node,entering){var tagname="bullet"===node.listType?"ul":"ol",attrs=this.attrs(node);if(entering){var start=node.listStart;null!==start&&1!==start&&attrs.push(["start",start.toString()]),this.cr(),this.tag(tagname,attrs),this.cr()}else this.cr(),this.tag("/"+tagname),this.cr()}function item(node,entering){var attrs=this.attrs(node);entering?this.tag("li",attrs):(this.tag("/li"),this.cr())}function html_inline(node){this.lit(this.options.safe?"<!-- raw HTML omitted -->":node.literal)}function html_block(node){this.cr(),this.lit(this.options.safe?"<!-- raw HTML omitted -->":node.literal),this.cr()}function custom_inline(node,entering){entering&&node.onEnter?this.lit(node.onEnter):!entering&&node.onExit&&this.lit(node.onExit)}function custom_block(node,entering){this.cr(),entering&&node.onEnter?this.lit(node.onEnter):!entering&&node.onExit&&this.lit(node.onExit),this.cr()}function out(s){this.lit(esc(s,!1))}function attrs(node){var att=[];if(this.options.sourcepos){var pos=node.sourcepos;pos&&att.push(["data-sourcepos",String(pos[0][0])+":"+String(pos[0][1])+"-"+String(pos[1][0])+":"+String(pos[1][1])])}return att}var Renderer=require("./renderer"),esc=require("../common").escapeXml,reUnsafeProtocol=/^javascript:|vbscript:|file:|data:/i,reSafeDataProtocol=/^data:image\/(?:png|gif|jpeg|webp)/i,potentiallyUnsafe=function(url){return reUnsafeProtocol.test(url)&&!reSafeDataProtocol.test(url)};HtmlRenderer.prototype=Object.create(Renderer.prototype),HtmlRenderer.prototype.text=text,HtmlRenderer.prototype.html_inline=html_inline,HtmlRenderer.prototype.html_block=html_block,HtmlRenderer.prototype.softbreak=softbreak,HtmlRenderer.prototype.linebreak=linebreak,HtmlRenderer.prototype.link=link,HtmlRenderer.prototype.image=image,HtmlRenderer.prototype.emph=emph,HtmlRenderer.prototype.strong=strong,HtmlRenderer.prototype.paragraph=paragraph,HtmlRenderer.prototype.heading=heading,HtmlRenderer.prototype.code=code,HtmlRenderer.prototype.code_block=code_block,HtmlRenderer.prototype.thematic_break=thematic_break,HtmlRenderer.prototype.block_quote=block_quote,HtmlRenderer.prototype.list=list,HtmlRenderer.prototype.item=item,HtmlRenderer.prototype.custom_inline=custom_inline,HtmlRenderer.prototype.custom_block=custom_block,HtmlRenderer.prototype.out=out,HtmlRenderer.prototype.tag=tag,HtmlRenderer.prototype.attrs=attrs,module.exports=HtmlRenderer},{"../common":2,"./renderer":9}],9:[function(require,module,exports){"use strict";function Renderer(){}function render(ast){var event,type,walker=ast.walker();for(this.buffer="",this.lastOut="\n";event=walker.next();)type=event.node.type,this[type]&&this[type](event.node,event.entering);return this.buffer}function lit(str){this.buffer+=str,this.lastOut=str}function cr(){"\n"!==this.lastOut&&this.lit("\n")}function out(str){this.lit(str)}Renderer.prototype.render=render,Renderer.prototype.out=out,Renderer.prototype.lit=lit,Renderer.prototype.cr=cr,module.exports=Renderer},{}],10:[function(require,module,exports){"use strict";function XmlRenderer(options){return{softbreak:"\n",escape:escapeXml,options:options||{},render:renderNodes}}var escapeXml=require("./common").escapeXml,tag=function(name,attrs,selfclosing){var result="<"+name;if(attrs&&attrs.length>0)for(var attrib,i=0;void 0!==(attrib=attrs[i]);)result+=" "+attrib[0]+'="'+escapeXml(attrib[1])+'"',i++;return selfclosing&&(result+=" /"),result+=">"},reXMLTag=/\<[^>]*\>/,toTagName=function(s){return s.replace(/([a-z])([A-Z])/g,"$1_$2").toLowerCase()},renderNodes=function(block){var attrs,tagname,event,node,entering,container,selfClosing,nodetype,walker=block.walker(),buffer="",lastOut="\n",disableTags=0,indentLevel=0,indent="  ",out=function(s){buffer+=disableTags>0?s.replace(reXMLTag,""):s,lastOut=s},esc=this.escape,cr=function(){if("\n"!==lastOut){buffer+="\n",lastOut="\n";for(var i=indentLevel;i>0;i--)buffer+=indent}},options=this.options;for(options.time&&console.time("rendering"),buffer+='<?xml version="1.0" encoding="UTF-8"?>\n',buffer+='<!DOCTYPE document SYSTEM "CommonMark.dtd">\n';event=walker.next();)if(entering=event.entering,node=event.node,nodetype=node.type,container=node.isContainer,selfClosing="thematic_break"===nodetype||"linebreak"===nodetype||"softbreak"===nodetype,tagname=toTagName(nodetype),entering){switch(attrs=[],nodetype){case"document":attrs.push(["xmlns","http://commonmark.org/xml/1.0"]);break;case"list":null!==node.listType&&attrs.push(["type",node.listType.toLowerCase()]),null!==node.listStart&&attrs.push(["start",String(node.listStart)]),null!==node.listTight&&attrs.push(["tight",node.listTight?"true":"false"]);var delim=node.listDelimiter;if(null!==delim){var delimword="";delimword="."===delim?"period":"paren",attrs.push(["delimiter",delimword])}break;case"code_block":node.info&&attrs.push(["info",node.info]);break;case"heading":attrs.push(["level",String(node.level)]);break;case"link":case"image":attrs.push(["destination",node.destination]),attrs.push(["title",node.title]);break;case"custom_inline":case"custom_block":attrs.push(["on_enter",node.onEnter]),attrs.push(["on_exit",node.onExit])}if(options.sourcepos){var pos=node.sourcepos;pos&&attrs.push(["sourcepos",String(pos[0][0])+":"+String(pos[0][1])+"-"+String(pos[1][0])+":"+String(pos[1][1])])}if(cr(),out(tag(tagname,attrs,selfClosing)),container)indentLevel+=1;else if(!container&&!selfClosing){var lit=node.literal;lit&&out(esc(lit)),out(tag("/"+tagname))}}else indentLevel-=1,cr(),out(tag("/"+tagname));return options.time&&console.timeEnd("rendering"),buffer+="\n"};module.exports=XmlRenderer},{"./common":2}],11:[function(require,module,exports){var encode=require("./lib/encode.js"),decode=require("./lib/decode.js");exports.decode=function(data,level){return(!level||level<=0?decode.XML:decode.HTML)(data)},exports.decodeStrict=function(data,level){return(!level||level<=0?decode.XML:decode.HTMLStrict)(data)},exports.encode=function(data,level){return(!level||level<=0?encode.XML:encode.HTML)(data)},exports.encodeXML=encode.XML,exports.encodeHTML4=exports.encodeHTML5=exports.encodeHTML=encode.HTML,exports.decodeXML=exports.decodeXMLStrict=decode.XML,exports.decodeHTML4=exports.decodeHTML5=exports.decodeHTML=decode.HTML,exports.decodeHTML4Strict=exports.decodeHTML5Strict=exports.decodeHTMLStrict=decode.HTMLStrict,exports.escape=encode.escape},{"./lib/decode.js":12,"./lib/encode.js":14}],12:[function(require,module,exports){function getStrictDecoder(map){var keys=Object.keys(map).join("|"),replace=getReplacer(map);keys+="|#[xX][\\da-fA-F]+|#\\d+";var re=new RegExp("&(?:"+keys+");","g");return function(str){return String(str).replace(re,replace)}}function sorter(a,b){return a<b?1:-1}function getReplacer(map){return function(str){return"#"===str.charAt(1)?decodeCodePoint("X"===str.charAt(2)||"x"===str.charAt(2)?parseInt(str.substr(3),16):parseInt(str.substr(2),10)):map[str.slice(1,-1)]}}var entityMap=require("../maps/entities.json"),legacyMap=require("../maps/legacy.json"),xmlMap=require("../maps/xml.json"),decodeCodePoint=require("./decode_codepoint.js"),decodeXMLStrict=getStrictDecoder(xmlMap),decodeHTMLStrict=getStrictDecoder(entityMap),decodeHTML=function(){function replacer(str){return";"!==str.substr(-1)&&(str+=";"),replace(str)}for(var legacy=Object.keys(legacyMap).sort(sorter),keys=Object.keys(entityMap).sort(sorter),i=0,j=0;i<keys.length;i++)legacy[j]===keys[i]?(keys[i]+=";?",j++):keys[i]+=";";var re=new RegExp("&(?:"+keys.join("|")+"|#[xX][\\da-fA-F]+;?|#\\d+;?)","g"),replace=getReplacer(entityMap);return function(str){return String(str).replace(re,replacer)}}();module.exports={XML:decodeXMLStrict,HTML:decodeHTML,HTMLStrict:decodeHTMLStrict}},{"../maps/entities.json":16,"../maps/legacy.json":17,"../maps/xml.json":18,
"./decode_codepoint.js":13}],13:[function(require,module,exports){function decodeCodePoint(codePoint){if(codePoint>=55296&&codePoint<=57343||codePoint>1114111)return"�";codePoint in decodeMap&&(codePoint=decodeMap[codePoint]);var output="";return codePoint>65535&&(codePoint-=65536,output+=String.fromCharCode(codePoint>>>10&1023|55296),codePoint=56320|1023&codePoint),output+=String.fromCharCode(codePoint)}var decodeMap=require("../maps/decode.json");module.exports=decodeCodePoint},{"../maps/decode.json":15}],14:[function(require,module,exports){function getInverseObj(obj){return Object.keys(obj).sort().reduce(function(inverse,name){return inverse[obj[name]]="&"+name+";",inverse},{})}function getInverseReplacer(inverse){var single=[],multiple=[];return Object.keys(inverse).forEach(function(k){1===k.length?single.push("\\"+k):multiple.push(k)}),multiple.unshift("["+single.join("")+"]"),new RegExp(multiple.join("|"),"g")}function singleCharReplacer(c){return"&#x"+c.charCodeAt(0).toString(16).toUpperCase()+";"}function astralReplacer(c){var high=c.charCodeAt(0),low=c.charCodeAt(1),codePoint=1024*(high-55296)+low-56320+65536;return"&#x"+codePoint.toString(16).toUpperCase()+";"}function getInverse(inverse,re){function func(name){return inverse[name]}return function(data){return data.replace(re,func).replace(re_astralSymbols,astralReplacer).replace(re_nonASCII,singleCharReplacer)}}function escapeXML(data){return data.replace(re_xmlChars,singleCharReplacer).replace(re_astralSymbols,astralReplacer).replace(re_nonASCII,singleCharReplacer)}var inverseXML=getInverseObj(require("../maps/xml.json")),xmlReplacer=getInverseReplacer(inverseXML);exports.XML=getInverse(inverseXML,xmlReplacer);var inverseHTML=getInverseObj(require("../maps/entities.json")),htmlReplacer=getInverseReplacer(inverseHTML);exports.HTML=getInverse(inverseHTML,htmlReplacer);var re_nonASCII=/[^\0-\x7F]/g,re_astralSymbols=/[\uD800-\uDBFF][\uDC00-\uDFFF]/g,re_xmlChars=getInverseReplacer(inverseXML);exports.escape=escapeXML},{"../maps/entities.json":16,"../maps/xml.json":18}],15:[function(require,module,exports){module.exports={0:65533,128:8364,130:8218,131:402,132:8222,133:8230,134:8224,135:8225,136:710,137:8240,138:352,139:8249,140:338,142:381,145:8216,146:8217,147:8220,148:8221,149:8226,150:8211,151:8212,152:732,153:8482,154:353,155:8250,156:339,158:382,159:376}},{}],16:[function(require,module,exports){module.exports={Aacute:"Á",aacute:"á",Abreve:"Ă",abreve:"ă",ac:"∾",acd:"∿",acE:"∾̳",Acirc:"Â",acirc:"â",acute:"´",Acy:"А",acy:"а",AElig:"Æ",aelig:"æ",af:"⁡",Afr:"𝔄",afr:"𝔞",Agrave:"À",agrave:"à",alefsym:"ℵ",aleph:"ℵ",Alpha:"Α",alpha:"α",Amacr:"Ā",amacr:"ā",amalg:"⨿",amp:"&",AMP:"&",andand:"⩕",And:"⩓",and:"∧",andd:"⩜",andslope:"⩘",andv:"⩚",ang:"∠",ange:"⦤",angle:"∠",angmsdaa:"⦨",angmsdab:"⦩",angmsdac:"⦪",angmsdad:"⦫",angmsdae:"⦬",angmsdaf:"⦭",angmsdag:"⦮",angmsdah:"⦯",angmsd:"∡",angrt:"∟",angrtvb:"⊾",angrtvbd:"⦝",angsph:"∢",angst:"Å",angzarr:"⍼",Aogon:"Ą",aogon:"ą",Aopf:"𝔸",aopf:"𝕒",apacir:"⩯",ap:"≈",apE:"⩰",ape:"≊",apid:"≋",apos:"'",ApplyFunction:"⁡",approx:"≈",approxeq:"≊",Aring:"Å",aring:"å",Ascr:"𝒜",ascr:"𝒶",Assign:"≔",ast:"*",asymp:"≈",asympeq:"≍",Atilde:"Ã",atilde:"ã",Auml:"Ä",auml:"ä",awconint:"∳",awint:"⨑",backcong:"≌",backepsilon:"϶",backprime:"‵",backsim:"∽",backsimeq:"⋍",Backslash:"∖",Barv:"⫧",barvee:"⊽",barwed:"⌅",Barwed:"⌆",barwedge:"⌅",bbrk:"⎵",bbrktbrk:"⎶",bcong:"≌",Bcy:"Б",bcy:"б",bdquo:"„",becaus:"∵",because:"∵",Because:"∵",bemptyv:"⦰",bepsi:"϶",bernou:"ℬ",Bernoullis:"ℬ",Beta:"Β",beta:"β",beth:"ℶ",between:"≬",Bfr:"𝔅",bfr:"𝔟",bigcap:"⋂",bigcirc:"◯",bigcup:"⋃",bigodot:"⨀",bigoplus:"⨁",bigotimes:"⨂",bigsqcup:"⨆",bigstar:"★",bigtriangledown:"▽",bigtriangleup:"△",biguplus:"⨄",bigvee:"⋁",bigwedge:"⋀",bkarow:"⤍",blacklozenge:"⧫",blacksquare:"▪",blacktriangle:"▴",blacktriangledown:"▾",blacktriangleleft:"◂",blacktriangleright:"▸",blank:"␣",blk12:"▒",blk14:"░",blk34:"▓",block:"█",bne:"=⃥",bnequiv:"≡⃥",bNot:"⫭",bnot:"⌐",Bopf:"𝔹",bopf:"𝕓",bot:"⊥",bottom:"⊥",bowtie:"⋈",boxbox:"⧉",boxdl:"┐",boxdL:"╕",boxDl:"╖",boxDL:"╗",boxdr:"┌",boxdR:"╒",boxDr:"╓",boxDR:"╔",boxh:"─",boxH:"═",boxhd:"┬",boxHd:"╤",boxhD:"╥",boxHD:"╦",boxhu:"┴",boxHu:"╧",boxhU:"╨",boxHU:"╩",boxminus:"⊟",boxplus:"⊞",boxtimes:"⊠",boxul:"┘",boxuL:"╛",boxUl:"╜",boxUL:"╝",boxur:"└",boxuR:"╘",boxUr:"╙",boxUR:"╚",boxv:"│",boxV:"║",boxvh:"┼",boxvH:"╪",boxVh:"╫",boxVH:"╬",boxvl:"┤",boxvL:"╡",boxVl:"╢",boxVL:"╣",boxvr:"├",boxvR:"╞",boxVr:"╟",boxVR:"╠",bprime:"‵",breve:"˘",Breve:"˘",brvbar:"¦",bscr:"𝒷",Bscr:"ℬ",bsemi:"⁏",bsim:"∽",bsime:"⋍",bsolb:"⧅",bsol:"\\",bsolhsub:"⟈",bull:"•",bullet:"•",bump:"≎",bumpE:"⪮",bumpe:"≏",Bumpeq:"≎",bumpeq:"≏",Cacute:"Ć",cacute:"ć",capand:"⩄",capbrcup:"⩉",capcap:"⩋",cap:"∩",Cap:"⋒",capcup:"⩇",capdot:"⩀",CapitalDifferentialD:"ⅅ",caps:"∩︀",caret:"⁁",caron:"ˇ",Cayleys:"ℭ",ccaps:"⩍",Ccaron:"Č",ccaron:"č",Ccedil:"Ç",ccedil:"ç",Ccirc:"Ĉ",ccirc:"ĉ",Cconint:"∰",ccups:"⩌",ccupssm:"⩐",Cdot:"Ċ",cdot:"ċ",cedil:"¸",Cedilla:"¸",cemptyv:"⦲",cent:"¢",centerdot:"·",CenterDot:"·",cfr:"𝔠",Cfr:"ℭ",CHcy:"Ч",chcy:"ч",check:"✓",checkmark:"✓",Chi:"Χ",chi:"χ",circ:"ˆ",circeq:"≗",circlearrowleft:"↺",circlearrowright:"↻",circledast:"⊛",circledcirc:"⊚",circleddash:"⊝",CircleDot:"⊙",circledR:"®",circledS:"Ⓢ",CircleMinus:"⊖",CirclePlus:"⊕",CircleTimes:"⊗",cir:"○",cirE:"⧃",cire:"≗",cirfnint:"⨐",cirmid:"⫯",cirscir:"⧂",ClockwiseContourIntegral:"∲",CloseCurlyDoubleQuote:"”",CloseCurlyQuote:"’",clubs:"♣",clubsuit:"♣",colon:":",Colon:"∷",Colone:"⩴",colone:"≔",coloneq:"≔",comma:",",commat:"@",comp:"∁",compfn:"∘",complement:"∁",complexes:"ℂ",cong:"≅",congdot:"⩭",Congruent:"≡",conint:"∮",Conint:"∯",ContourIntegral:"∮",copf:"𝕔",Copf:"ℂ",coprod:"∐",Coproduct:"∐",copy:"©",COPY:"©",copysr:"℗",CounterClockwiseContourIntegral:"∳",crarr:"↵",cross:"✗",Cross:"⨯",Cscr:"𝒞",cscr:"𝒸",csub:"⫏",csube:"⫑",csup:"⫐",csupe:"⫒",ctdot:"⋯",cudarrl:"⤸",cudarrr:"⤵",cuepr:"⋞",cuesc:"⋟",cularr:"↶",cularrp:"⤽",cupbrcap:"⩈",cupcap:"⩆",CupCap:"≍",cup:"∪",Cup:"⋓",cupcup:"⩊",cupdot:"⊍",cupor:"⩅",cups:"∪︀",curarr:"↷",curarrm:"⤼",curlyeqprec:"⋞",curlyeqsucc:"⋟",curlyvee:"⋎",curlywedge:"⋏",curren:"¤",curvearrowleft:"↶",curvearrowright:"↷",cuvee:"⋎",cuwed:"⋏",cwconint:"∲",cwint:"∱",cylcty:"⌭",dagger:"†",Dagger:"‡",daleth:"ℸ",darr:"↓",Darr:"↡",dArr:"⇓",dash:"‐",Dashv:"⫤",dashv:"⊣",dbkarow:"⤏",dblac:"˝",Dcaron:"Ď",dcaron:"ď",Dcy:"Д",dcy:"д",ddagger:"‡",ddarr:"⇊",DD:"ⅅ",dd:"ⅆ",DDotrahd:"⤑",ddotseq:"⩷",deg:"°",Del:"∇",Delta:"Δ",delta:"δ",demptyv:"⦱",dfisht:"⥿",Dfr:"𝔇",dfr:"𝔡",dHar:"⥥",dharl:"⇃",dharr:"⇂",DiacriticalAcute:"´",DiacriticalDot:"˙",DiacriticalDoubleAcute:"˝",DiacriticalGrave:"`",DiacriticalTilde:"˜",diam:"⋄",diamond:"⋄",Diamond:"⋄",diamondsuit:"♦",diams:"♦",die:"¨",DifferentialD:"ⅆ",digamma:"ϝ",disin:"⋲",div:"÷",divide:"÷",divideontimes:"⋇",divonx:"⋇",DJcy:"Ђ",djcy:"ђ",dlcorn:"⌞",dlcrop:"⌍",dollar:"$",Dopf:"𝔻",dopf:"𝕕",Dot:"¨",dot:"˙",DotDot:"⃜",doteq:"≐",doteqdot:"≑",DotEqual:"≐",dotminus:"∸",dotplus:"∔",dotsquare:"⊡",doublebarwedge:"⌆",DoubleContourIntegral:"∯",DoubleDot:"¨",DoubleDownArrow:"⇓",DoubleLeftArrow:"⇐",DoubleLeftRightArrow:"⇔",DoubleLeftTee:"⫤",DoubleLongLeftArrow:"⟸",DoubleLongLeftRightArrow:"⟺",DoubleLongRightArrow:"⟹",DoubleRightArrow:"⇒",DoubleRightTee:"⊨",DoubleUpArrow:"⇑",DoubleUpDownArrow:"⇕",DoubleVerticalBar:"∥",DownArrowBar:"⤓",downarrow:"↓",DownArrow:"↓",Downarrow:"⇓",DownArrowUpArrow:"⇵",DownBreve:"̑",downdownarrows:"⇊",downharpoonleft:"⇃",downharpoonright:"⇂",DownLeftRightVector:"⥐",DownLeftTeeVector:"⥞",DownLeftVectorBar:"⥖",DownLeftVector:"↽",DownRightTeeVector:"⥟",DownRightVectorBar:"⥗",DownRightVector:"⇁",DownTeeArrow:"↧",DownTee:"⊤",drbkarow:"⤐",drcorn:"⌟",drcrop:"⌌",Dscr:"𝒟",dscr:"𝒹",DScy:"Ѕ",dscy:"ѕ",dsol:"⧶",Dstrok:"Đ",dstrok:"đ",dtdot:"⋱",dtri:"▿",dtrif:"▾",duarr:"⇵",duhar:"⥯",dwangle:"⦦",DZcy:"Џ",dzcy:"џ",dzigrarr:"⟿",Eacute:"É",eacute:"é",easter:"⩮",Ecaron:"Ě",ecaron:"ě",Ecirc:"Ê",ecirc:"ê",ecir:"≖",ecolon:"≕",Ecy:"Э",ecy:"э",eDDot:"⩷",Edot:"Ė",edot:"ė",eDot:"≑",ee:"ⅇ",efDot:"≒",Efr:"𝔈",efr:"𝔢",eg:"⪚",Egrave:"È",egrave:"è",egs:"⪖",egsdot:"⪘",el:"⪙",Element:"∈",elinters:"⏧",ell:"ℓ",els:"⪕",elsdot:"⪗",Emacr:"Ē",emacr:"ē",empty:"∅",emptyset:"∅",EmptySmallSquare:"◻",emptyv:"∅",EmptyVerySmallSquare:"▫",emsp13:" ",emsp14:" ",emsp:" ",ENG:"Ŋ",eng:"ŋ",ensp:" ",Eogon:"Ę",eogon:"ę",Eopf:"𝔼",eopf:"𝕖",epar:"⋕",eparsl:"⧣",eplus:"⩱",epsi:"ε",Epsilon:"Ε",epsilon:"ε",epsiv:"ϵ",eqcirc:"≖",eqcolon:"≕",eqsim:"≂",eqslantgtr:"⪖",eqslantless:"⪕",Equal:"⩵",equals:"=",EqualTilde:"≂",equest:"≟",Equilibrium:"⇌",equiv:"≡",equivDD:"⩸",eqvparsl:"⧥",erarr:"⥱",erDot:"≓",escr:"ℯ",Escr:"ℰ",esdot:"≐",Esim:"⩳",esim:"≂",Eta:"Η",eta:"η",ETH:"Ð",eth:"ð",Euml:"Ë",euml:"ë",euro:"€",excl:"!",exist:"∃",Exists:"∃",expectation:"ℰ",exponentiale:"ⅇ",ExponentialE:"ⅇ",fallingdotseq:"≒",Fcy:"Ф",fcy:"ф",female:"♀",ffilig:"ﬃ",fflig:"ﬀ",ffllig:"ﬄ",Ffr:"𝔉",ffr:"𝔣",filig:"ﬁ",FilledSmallSquare:"◼",FilledVerySmallSquare:"▪",fjlig:"fj",flat:"♭",fllig:"ﬂ",fltns:"▱",fnof:"ƒ",Fopf:"𝔽",fopf:"𝕗",forall:"∀",ForAll:"∀",fork:"⋔",forkv:"⫙",Fouriertrf:"ℱ",fpartint:"⨍",frac12:"½",frac13:"⅓",frac14:"¼",frac15:"⅕",frac16:"⅙",frac18:"⅛",frac23:"⅔",frac25:"⅖",frac34:"¾",frac35:"⅗",frac38:"⅜",frac45:"⅘",frac56:"⅚",frac58:"⅝",frac78:"⅞",frasl:"⁄",frown:"⌢",fscr:"𝒻",Fscr:"ℱ",gacute:"ǵ",Gamma:"Γ",gamma:"γ",Gammad:"Ϝ",gammad:"ϝ",gap:"⪆",Gbreve:"Ğ",gbreve:"ğ",Gcedil:"Ģ",Gcirc:"Ĝ",gcirc:"ĝ",Gcy:"Г",gcy:"г",Gdot:"Ġ",gdot:"ġ",ge:"≥",gE:"≧",gEl:"⪌",gel:"⋛",geq:"≥",geqq:"≧",geqslant:"⩾",gescc:"⪩",ges:"⩾",gesdot:"⪀",gesdoto:"⪂",gesdotol:"⪄",gesl:"⋛︀",gesles:"⪔",Gfr:"𝔊",gfr:"𝔤",gg:"≫",Gg:"⋙",ggg:"⋙",gimel:"ℷ",GJcy:"Ѓ",gjcy:"ѓ",gla:"⪥",gl:"≷",glE:"⪒",glj:"⪤",gnap:"⪊",gnapprox:"⪊",gne:"⪈",gnE:"≩",gneq:"⪈",gneqq:"≩",gnsim:"⋧",Gopf:"𝔾",gopf:"𝕘",grave:"`",GreaterEqual:"≥",GreaterEqualLess:"⋛",GreaterFullEqual:"≧",GreaterGreater:"⪢",GreaterLess:"≷",GreaterSlantEqual:"⩾",GreaterTilde:"≳",Gscr:"𝒢",gscr:"ℊ",gsim:"≳",gsime:"⪎",gsiml:"⪐",gtcc:"⪧",gtcir:"⩺",gt:">",GT:">",Gt:"≫",gtdot:"⋗",gtlPar:"⦕",gtquest:"⩼",gtrapprox:"⪆",gtrarr:"⥸",gtrdot:"⋗",gtreqless:"⋛",gtreqqless:"⪌",gtrless:"≷",gtrsim:"≳",gvertneqq:"≩︀",gvnE:"≩︀",Hacek:"ˇ",hairsp:" ",half:"½",hamilt:"ℋ",HARDcy:"Ъ",hardcy:"ъ",harrcir:"⥈",harr:"↔",hArr:"⇔",harrw:"↭",Hat:"^",hbar:"ℏ",Hcirc:"Ĥ",hcirc:"ĥ",hearts:"♥",heartsuit:"♥",hellip:"…",hercon:"⊹",hfr:"𝔥",Hfr:"ℌ",HilbertSpace:"ℋ",hksearow:"⤥",hkswarow:"⤦",hoarr:"⇿",homtht:"∻",hookleftarrow:"↩",hookrightarrow:"↪",hopf:"𝕙",Hopf:"ℍ",horbar:"―",HorizontalLine:"─",hscr:"𝒽",Hscr:"ℋ",hslash:"ℏ",Hstrok:"Ħ",hstrok:"ħ",HumpDownHump:"≎",HumpEqual:"≏",hybull:"⁃",hyphen:"‐",Iacute:"Í",iacute:"í",ic:"⁣",Icirc:"Î",icirc:"î",Icy:"И",icy:"и",Idot:"İ",IEcy:"Е",iecy:"е",iexcl:"¡",iff:"⇔",ifr:"𝔦",Ifr:"ℑ",Igrave:"Ì",igrave:"ì",ii:"ⅈ",iiiint:"⨌",iiint:"∭",iinfin:"⧜",iiota:"℩",IJlig:"Ĳ",ijlig:"ĳ",Imacr:"Ī",imacr:"ī",image:"ℑ",ImaginaryI:"ⅈ",imagline:"ℐ",imagpart:"ℑ",imath:"ı",Im:"ℑ",imof:"⊷",imped:"Ƶ",Implies:"⇒",incare:"℅",in:"∈",infin:"∞",infintie:"⧝",inodot:"ı",intcal:"⊺",int:"∫",Int:"∬",integers:"ℤ",Integral:"∫",intercal:"⊺",Intersection:"⋂",intlarhk:"⨗",intprod:"⨼",InvisibleComma:"⁣",InvisibleTimes:"⁢",IOcy:"Ё",iocy:"ё",Iogon:"Į",iogon:"į",Iopf:"𝕀",iopf:"𝕚",Iota:"Ι",iota:"ι",iprod:"⨼",iquest:"¿",iscr:"𝒾",Iscr:"ℐ",isin:"∈",isindot:"⋵",isinE:"⋹",isins:"⋴",isinsv:"⋳",isinv:"∈",it:"⁢",Itilde:"Ĩ",itilde:"ĩ",Iukcy:"І",iukcy:"і",Iuml:"Ï",iuml:"ï",Jcirc:"Ĵ",jcirc:"ĵ",Jcy:"Й",jcy:"й",Jfr:"𝔍",jfr:"𝔧",jmath:"ȷ",Jopf:"𝕁",jopf:"𝕛",Jscr:"𝒥",jscr:"𝒿",Jsercy:"Ј",jsercy:"ј",Jukcy:"Є",jukcy:"є",Kappa:"Κ",kappa:"κ",kappav:"ϰ",Kcedil:"Ķ",kcedil:"ķ",Kcy:"К",kcy:"к",Kfr:"𝔎",kfr:"𝔨",kgreen:"ĸ",KHcy:"Х",khcy:"х",KJcy:"Ќ",kjcy:"ќ",Kopf:"𝕂",kopf:"𝕜",Kscr:"𝒦",kscr:"𝓀",lAarr:"⇚",Lacute:"Ĺ",lacute:"ĺ",laemptyv:"⦴",lagran:"ℒ",Lambda:"Λ",lambda:"λ",lang:"⟨",Lang:"⟪",langd:"⦑",langle:"⟨",lap:"⪅",Laplacetrf:"ℒ",laquo:"«",larrb:"⇤",larrbfs:"⤟",larr:"←",Larr:"↞",lArr:"⇐",larrfs:"⤝",larrhk:"↩",larrlp:"↫",larrpl:"⤹",larrsim:"⥳",larrtl:"↢",latail:"⤙",lAtail:"⤛",lat:"⪫",late:"⪭",lates:"⪭︀",lbarr:"⤌",lBarr:"⤎",lbbrk:"❲",lbrace:"{",lbrack:"[",lbrke:"⦋",lbrksld:"⦏",lbrkslu:"⦍",Lcaron:"Ľ",lcaron:"ľ",Lcedil:"Ļ",lcedil:"ļ",lceil:"⌈",lcub:"{",Lcy:"Л",lcy:"л",ldca:"⤶",ldquo:"“",ldquor:"„",ldrdhar:"⥧",ldrushar:"⥋",ldsh:"↲",le:"≤",lE:"≦",LeftAngleBracket:"⟨",LeftArrowBar:"⇤",leftarrow:"←",LeftArrow:"←",Leftarrow:"⇐",LeftArrowRightArrow:"⇆",leftarrowtail:"↢",LeftCeiling:"⌈",LeftDoubleBracket:"⟦",LeftDownTeeVector:"⥡",LeftDownVectorBar:"⥙",LeftDownVector:"⇃",LeftFloor:"⌊",leftharpoondown:"↽",leftharpoonup:"↼",leftleftarrows:"⇇",leftrightarrow:"↔",LeftRightArrow:"↔",Leftrightarrow:"⇔",leftrightarrows:"⇆",leftrightharpoons:"⇋",leftrightsquigarrow:"↭",LeftRightVector:"⥎",LeftTeeArrow:"↤",LeftTee:"⊣",LeftTeeVector:"⥚",leftthreetimes:"⋋",LeftTriangleBar:"⧏",LeftTriangle:"⊲",LeftTriangleEqual:"⊴",LeftUpDownVector:"⥑",LeftUpTeeVector:"⥠",LeftUpVectorBar:"⥘",LeftUpVector:"↿",LeftVectorBar:"⥒",LeftVector:"↼",lEg:"⪋",leg:"⋚",leq:"≤",leqq:"≦",leqslant:"⩽",lescc:"⪨",les:"⩽",lesdot:"⩿",lesdoto:"⪁",lesdotor:"⪃",lesg:"⋚︀",lesges:"⪓",lessapprox:"⪅",lessdot:"⋖",lesseqgtr:"⋚",lesseqqgtr:"⪋",LessEqualGreater:"⋚",LessFullEqual:"≦",LessGreater:"≶",lessgtr:"≶",LessLess:"⪡",lesssim:"≲",LessSlantEqual:"⩽",LessTilde:"≲",lfisht:"⥼",lfloor:"⌊",Lfr:"𝔏",lfr:"𝔩",lg:"≶",lgE:"⪑",lHar:"⥢",lhard:"↽",lharu:"↼",lharul:"⥪",lhblk:"▄",LJcy:"Љ",ljcy:"љ",llarr:"⇇",ll:"≪",Ll:"⋘",llcorner:"⌞",Lleftarrow:"⇚",llhard:"⥫",lltri:"◺",Lmidot:"Ŀ",lmidot:"ŀ",lmoustache:"⎰",lmoust:"⎰",lnap:"⪉",lnapprox:"⪉",lne:"⪇",lnE:"≨",lneq:"⪇",lneqq:"≨",lnsim:"⋦",loang:"⟬",loarr:"⇽",lobrk:"⟦",longleftarrow:"⟵",LongLeftArrow:"⟵",Longleftarrow:"⟸",longleftrightarrow:"⟷",LongLeftRightArrow:"⟷",Longleftrightarrow:"⟺",longmapsto:"⟼",longrightarrow:"⟶",LongRightArrow:"⟶",Longrightarrow:"⟹",looparrowleft:"↫",looparrowright:"↬",lopar:"⦅",Lopf:"𝕃",lopf:"𝕝",loplus:"⨭",lotimes:"⨴",lowast:"∗",lowbar:"_",LowerLeftArrow:"↙",LowerRightArrow:"↘",loz:"◊",lozenge:"◊",lozf:"⧫",lpar:"(",lparlt:"⦓",lrarr:"⇆",lrcorner:"⌟",lrhar:"⇋",lrhard:"⥭",lrm:"‎",lrtri:"⊿",lsaquo:"‹",lscr:"𝓁",Lscr:"ℒ",lsh:"↰",Lsh:"↰",lsim:"≲",lsime:"⪍",lsimg:"⪏",lsqb:"[",lsquo:"‘",lsquor:"‚",Lstrok:"Ł",lstrok:"ł",ltcc:"⪦",ltcir:"⩹",lt:"<",LT:"<",Lt:"≪",ltdot:"⋖",lthree:"⋋",ltimes:"⋉",ltlarr:"⥶",ltquest:"⩻",ltri:"◃",ltrie:"⊴",ltrif:"◂",ltrPar:"⦖",lurdshar:"⥊",luruhar:"⥦",lvertneqq:"≨︀",lvnE:"≨︀",macr:"¯",male:"♂",malt:"✠",maltese:"✠",Map:"⤅",map:"↦",mapsto:"↦",mapstodown:"↧",mapstoleft:"↤",mapstoup:"↥",marker:"▮",mcomma:"⨩",Mcy:"М",mcy:"м",mdash:"—",mDDot:"∺",measuredangle:"∡",MediumSpace:" ",Mellintrf:"ℳ",Mfr:"𝔐",mfr:"𝔪",mho:"℧",micro:"µ",midast:"*",midcir:"⫰",mid:"∣",middot:"·",minusb:"⊟",minus:"−",minusd:"∸",minusdu:"⨪",MinusPlus:"∓",mlcp:"⫛",mldr:"…",mnplus:"∓",models:"⊧",Mopf:"𝕄",mopf:"𝕞",mp:"∓",mscr:"𝓂",Mscr:"ℳ",mstpos:"∾",Mu:"Μ",mu:"μ",multimap:"⊸",mumap:"⊸",nabla:"∇",Nacute:"Ń",nacute:"ń",nang:"∠⃒",nap:"≉",napE:"⩰̸",napid:"≋̸",napos:"ŉ",napprox:"≉",natural:"♮",naturals:"ℕ",natur:"♮",nbsp:" ",nbump:"≎̸",nbumpe:"≏̸",ncap:"⩃",Ncaron:"Ň",ncaron:"ň",Ncedil:"Ņ",ncedil:"ņ",ncong:"≇",ncongdot:"⩭̸",ncup:"⩂",Ncy:"Н",ncy:"н",ndash:"–",nearhk:"⤤",nearr:"↗",neArr:"⇗",nearrow:"↗",ne:"≠",nedot:"≐̸",NegativeMediumSpace:"​",NegativeThickSpace:"​",NegativeThinSpace:"​",NegativeVeryThinSpace:"​",nequiv:"≢",nesear:"⤨",nesim:"≂̸",NestedGreaterGreater:"≫",NestedLessLess:"≪",NewLine:"\n",nexist:"∄",nexists:"∄",Nfr:"𝔑",nfr:"𝔫",ngE:"≧̸",nge:"≱",ngeq:"≱",ngeqq:"≧̸",ngeqslant:"⩾̸",nges:"⩾̸",nGg:"⋙̸",ngsim:"≵",nGt:"≫⃒",ngt:"≯",ngtr:"≯",nGtv:"≫̸",nharr:"↮",nhArr:"⇎",nhpar:"⫲",ni:"∋",nis:"⋼",nisd:"⋺",niv:"∋",NJcy:"Њ",njcy:"њ",nlarr:"↚",nlArr:"⇍",nldr:"‥",nlE:"≦̸",nle:"≰",nleftarrow:"↚",nLeftarrow:"⇍",nleftrightarrow:"↮",nLeftrightarrow:"⇎",nleq:"≰",nleqq:"≦̸",nleqslant:"⩽̸",nles:"⩽̸",nless:"≮",nLl:"⋘̸",nlsim:"≴",nLt:"≪⃒",nlt:"≮",nltri:"⋪",nltrie:"⋬",nLtv:"≪̸",nmid:"∤",NoBreak:"⁠",NonBreakingSpace:" ",nopf:"𝕟",Nopf:"ℕ",Not:"⫬",not:"¬",NotCongruent:"≢",NotCupCap:"≭",NotDoubleVerticalBar:"∦",NotElement:"∉",NotEqual:"≠",NotEqualTilde:"≂̸",NotExists:"∄",NotGreater:"≯",NotGreaterEqual:"≱",NotGreaterFullEqual:"≧̸",NotGreaterGreater:"≫̸",NotGreaterLess:"≹",NotGreaterSlantEqual:"⩾̸",NotGreaterTilde:"≵",NotHumpDownHump:"≎̸",NotHumpEqual:"≏̸",notin:"∉",notindot:"⋵̸",notinE:"⋹̸",notinva:"∉",notinvb:"⋷",notinvc:"⋶",NotLeftTriangleBar:"⧏̸",NotLeftTriangle:"⋪",NotLeftTriangleEqual:"⋬",NotLess:"≮",NotLessEqual:"≰",NotLessGreater:"≸",NotLessLess:"≪̸",NotLessSlantEqual:"⩽̸",NotLessTilde:"≴",NotNestedGreaterGreater:"⪢̸",NotNestedLessLess:"⪡̸",notni:"∌",notniva:"∌",notnivb:"⋾",notnivc:"⋽",NotPrecedes:"⊀",NotPrecedesEqual:"⪯̸",NotPrecedesSlantEqual:"⋠",NotReverseElement:"∌",NotRightTriangleBar:"⧐̸",NotRightTriangle:"⋫",NotRightTriangleEqual:"⋭",NotSquareSubset:"⊏̸",NotSquareSubsetEqual:"⋢",NotSquareSuperset:"⊐̸",NotSquareSupersetEqual:"⋣",NotSubset:"⊂⃒",NotSubsetEqual:"⊈",NotSucceeds:"⊁",NotSucceedsEqual:"⪰̸",NotSucceedsSlantEqual:"⋡",NotSucceedsTilde:"≿̸",NotSuperset:"⊃⃒",NotSupersetEqual:"⊉",NotTilde:"≁",NotTildeEqual:"≄",NotTildeFullEqual:"≇",NotTildeTilde:"≉",NotVerticalBar:"∤",nparallel:"∦",npar:"∦",nparsl:"⫽⃥",npart:"∂̸",npolint:"⨔",npr:"⊀",nprcue:"⋠",nprec:"⊀",npreceq:"⪯̸",npre:"⪯̸",nrarrc:"⤳̸",nrarr:"↛",nrArr:"⇏",nrarrw:"↝̸",nrightarrow:"↛",nRightarrow:"⇏",nrtri:"⋫",nrtrie:"⋭",nsc:"⊁",nsccue:"⋡",nsce:"⪰̸",Nscr:"𝒩",nscr:"𝓃",nshortmid:"∤",nshortparallel:"∦",nsim:"≁",nsime:"≄",nsimeq:"≄",nsmid:"∤",nspar:"∦",nsqsube:"⋢",nsqsupe:"⋣",nsub:"⊄",nsubE:"⫅̸",nsube:"⊈",nsubset:"⊂⃒",nsubseteq:"⊈",nsubseteqq:"⫅̸",nsucc:"⊁",nsucceq:"⪰̸",nsup:"⊅",nsupE:"⫆̸",nsupe:"⊉",nsupset:"⊃⃒",nsupseteq:"⊉",nsupseteqq:"⫆̸",ntgl:"≹",Ntilde:"Ñ",ntilde:"ñ",ntlg:"≸",ntriangleleft:"⋪",ntrianglelefteq:"⋬",ntriangleright:"⋫",ntrianglerighteq:"⋭",Nu:"Ν",nu:"ν",num:"#",numero:"№",numsp:" ",nvap:"≍⃒",nvdash:"⊬",nvDash:"⊭",nVdash:"⊮",nVDash:"⊯",nvge:"≥⃒",nvgt:">⃒",nvHarr:"⤄",nvinfin:"⧞",nvlArr:"⤂",nvle:"≤⃒",nvlt:"<⃒",nvltrie:"⊴⃒",nvrArr:"⤃",nvrtrie:"⊵⃒",nvsim:"∼⃒",nwarhk:"⤣",nwarr:"↖",nwArr:"⇖",nwarrow:"↖",nwnear:"⤧",Oacute:"Ó",oacute:"ó",oast:"⊛",Ocirc:"Ô",ocirc:"ô",ocir:"⊚",Ocy:"О",ocy:"о",odash:"⊝",Odblac:"Ő",odblac:"ő",odiv:"⨸",odot:"⊙",odsold:"⦼",OElig:"Œ",oelig:"œ",ofcir:"⦿",Ofr:"𝔒",ofr:"𝔬",ogon:"˛",Ograve:"Ò",ograve:"ò",ogt:"⧁",ohbar:"⦵",ohm:"Ω",oint:"∮",olarr:"↺",olcir:"⦾",olcross:"⦻",oline:"‾",olt:"⧀",Omacr:"Ō",omacr:"ō",Omega:"Ω",omega:"ω",Omicron:"Ο",omicron:"ο",omid:"⦶",ominus:"⊖",Oopf:"𝕆",oopf:"𝕠",opar:"⦷",OpenCurlyDoubleQuote:"“",OpenCurlyQuote:"‘",operp:"⦹",oplus:"⊕",orarr:"↻",Or:"⩔",or:"∨",ord:"⩝",order:"ℴ",orderof:"ℴ",ordf:"ª",ordm:"º",origof:"⊶",oror:"⩖",orslope:"⩗",orv:"⩛",oS:"Ⓢ",Oscr:"𝒪",oscr:"ℴ",Oslash:"Ø",oslash:"ø",osol:"⊘",Otilde:"Õ",otilde:"õ",otimesas:"⨶",Otimes:"⨷",otimes:"⊗",Ouml:"Ö",ouml:"ö",ovbar:"⌽",OverBar:"‾",OverBrace:"⏞",OverBracket:"⎴",OverParenthesis:"⏜",para:"¶",parallel:"∥",par:"∥",parsim:"⫳",parsl:"⫽",part:"∂",PartialD:"∂",Pcy:"П",pcy:"п",percnt:"%",period:".",permil:"‰",perp:"⊥",pertenk:"‱",Pfr:"𝔓",pfr:"𝔭",Phi:"Φ",phi:"φ",phiv:"ϕ",phmmat:"ℳ",phone:"☎",Pi:"Π",pi:"π",pitchfork:"⋔",piv:"ϖ",planck:"ℏ",planckh:"ℎ",plankv:"ℏ",plusacir:"⨣",plusb:"⊞",pluscir:"⨢",plus:"+",plusdo:"∔",plusdu:"⨥",pluse:"⩲",PlusMinus:"±",plusmn:"±",plussim:"⨦",plustwo:"⨧",pm:"±",Poincareplane:"ℌ",pointint:"⨕",popf:"𝕡",Popf:"ℙ",pound:"£",prap:"⪷",Pr:"⪻",pr:"≺",prcue:"≼",precapprox:"⪷",prec:"≺",preccurlyeq:"≼",Precedes:"≺",PrecedesEqual:"⪯",PrecedesSlantEqual:"≼",PrecedesTilde:"≾",preceq:"⪯",precnapprox:"⪹",precneqq:"⪵",precnsim:"⋨",pre:"⪯",prE:"⪳",precsim:"≾",prime:"′",Prime:"″",primes:"ℙ",prnap:"⪹",prnE:"⪵",prnsim:"⋨",prod:"∏",Product:"∏",profalar:"⌮",profline:"⌒",profsurf:"⌓",prop:"∝",Proportional:"∝",Proportion:"∷",propto:"∝",prsim:"≾",prurel:"⊰",Pscr:"𝒫",pscr:"𝓅",Psi:"Ψ",psi:"ψ",puncsp:" ",Qfr:"𝔔",qfr:"𝔮",qint:"⨌",qopf:"𝕢",Qopf:"ℚ",qprime:"⁗",Qscr:"𝒬",qscr:"𝓆",quaternions:"ℍ",quatint:"⨖",quest:"?",questeq:"≟",quot:'"',QUOT:'"',rAarr:"⇛",race:"∽̱",Racute:"Ŕ",racute:"ŕ",radic:"√",raemptyv:"⦳",rang:"⟩",Rang:"⟫",rangd:"⦒",range:"⦥",rangle:"⟩",raquo:"»",rarrap:"⥵",rarrb:"⇥",rarrbfs:"⤠",rarrc:"⤳",rarr:"→",Rarr:"↠",rArr:"⇒",rarrfs:"⤞",rarrhk:"↪",rarrlp:"↬",rarrpl:"⥅",rarrsim:"⥴",Rarrtl:"⤖",rarrtl:"↣",rarrw:"↝",ratail:"⤚",rAtail:"⤜",ratio:"∶",rationals:"ℚ",rbarr:"⤍",rBarr:"⤏",RBarr:"⤐",rbbrk:"❳",rbrace:"}",rbrack:"]",rbrke:"⦌",rbrksld:"⦎",rbrkslu:"⦐",Rcaron:"Ř",rcaron:"ř",Rcedil:"Ŗ",rcedil:"ŗ",rceil:"⌉",rcub:"}",Rcy:"Р",rcy:"р",rdca:"⤷",rdldhar:"⥩",rdquo:"”",rdquor:"”",rdsh:"↳",real:"ℜ",realine:"ℛ",realpart:"ℜ",reals:"ℝ",Re:"ℜ",rect:"▭",reg:"®",REG:"®",ReverseElement:"∋",ReverseEquilibrium:"⇋",ReverseUpEquilibrium:"⥯",rfisht:"⥽",rfloor:"⌋",rfr:"𝔯",Rfr:"ℜ",rHar:"⥤",rhard:"⇁",rharu:"⇀",rharul:"⥬",Rho:"Ρ",rho:"ρ",rhov:"ϱ",RightAngleBracket:"⟩",RightArrowBar:"⇥",rightarrow:"→",RightArrow:"→",Rightarrow:"⇒",RightArrowLeftArrow:"⇄",rightarrowtail:"↣",RightCeiling:"⌉",RightDoubleBracket:"⟧",RightDownTeeVector:"⥝",RightDownVectorBar:"⥕",RightDownVector:"⇂",RightFloor:"⌋",rightharpoondown:"⇁",rightharpoonup:"⇀",rightleftarrows:"⇄",rightleftharpoons:"⇌",rightrightarrows:"⇉",rightsquigarrow:"↝",RightTeeArrow:"↦",RightTee:"⊢",RightTeeVector:"⥛",rightthreetimes:"⋌",RightTriangleBar:"⧐",RightTriangle:"⊳",RightTriangleEqual:"⊵",RightUpDownVector:"⥏",RightUpTeeVector:"⥜",RightUpVectorBar:"⥔",RightUpVector:"↾",RightVectorBar:"⥓",RightVector:"⇀",ring:"˚",risingdotseq:"≓",rlarr:"⇄",rlhar:"⇌",rlm:"‏",rmoustache:"⎱",rmoust:"⎱",rnmid:"⫮",roang:"⟭",roarr:"⇾",robrk:"⟧",ropar:"⦆",ropf:"𝕣",Ropf:"ℝ",roplus:"⨮",rotimes:"⨵",RoundImplies:"⥰",rpar:")",rpargt:"⦔",rppolint:"⨒",rrarr:"⇉",Rrightarrow:"⇛",rsaquo:"›",rscr:"𝓇",Rscr:"ℛ",rsh:"↱",Rsh:"↱",rsqb:"]",rsquo:"’",rsquor:"’",rthree:"⋌",rtimes:"⋊",rtri:"▹",rtrie:"⊵",rtrif:"▸",rtriltri:"⧎",RuleDelayed:"⧴",ruluhar:"⥨",rx:"℞",Sacute:"Ś",sacute:"ś",sbquo:"‚",scap:"⪸",Scaron:"Š",scaron:"š",Sc:"⪼",sc:"≻",sccue:"≽",sce:"⪰",scE:"⪴",Scedil:"Ş",scedil:"ş",Scirc:"Ŝ",scirc:"ŝ",scnap:"⪺",scnE:"⪶",scnsim:"⋩",scpolint:"⨓",scsim:"≿",Scy:"С",scy:"с",sdotb:"⊡",sdot:"⋅",sdote:"⩦",searhk:"⤥",searr:"↘",seArr:"⇘",searrow:"↘",sect:"§",semi:";",seswar:"⤩",setminus:"∖",setmn:"∖",sext:"✶",Sfr:"𝔖",sfr:"𝔰",sfrown:"⌢",sharp:"♯",SHCHcy:"Щ",shchcy:"щ",SHcy:"Ш",shcy:"ш",ShortDownArrow:"↓",ShortLeftArrow:"←",shortmid:"∣",shortparallel:"∥",ShortRightArrow:"→",ShortUpArrow:"↑",shy:"­",Sigma:"Σ",sigma:"σ",sigmaf:"ς",sigmav:"ς",sim:"∼",simdot:"⩪",sime:"≃",simeq:"≃",simg:"⪞",simgE:"⪠",siml:"⪝",simlE:"⪟",simne:"≆",simplus:"⨤",simrarr:"⥲",slarr:"←",SmallCircle:"∘",smallsetminus:"∖",smashp:"⨳",smeparsl:"⧤",smid:"∣",smile:"⌣",smt:"⪪",smte:"⪬",smtes:"⪬︀",SOFTcy:"Ь",softcy:"ь",solbar:"⌿",solb:"⧄",sol:"/",Sopf:"𝕊",sopf:"𝕤",spades:"♠",spadesuit:"♠",spar:"∥",sqcap:"⊓",sqcaps:"⊓︀",sqcup:"⊔",sqcups:"⊔︀",Sqrt:"√",sqsub:"⊏",sqsube:"⊑",sqsubset:"⊏",sqsubseteq:"⊑",sqsup:"⊐",sqsupe:"⊒",sqsupset:"⊐",sqsupseteq:"⊒",square:"□",Square:"□",SquareIntersection:"⊓",SquareSubset:"⊏",SquareSubsetEqual:"⊑",SquareSuperset:"⊐",SquareSupersetEqual:"⊒",SquareUnion:"⊔",squarf:"▪",squ:"□",squf:"▪",srarr:"→",Sscr:"𝒮",sscr:"𝓈",ssetmn:"∖",ssmile:"⌣",sstarf:"⋆",Star:"⋆",star:"☆",starf:"★",straightepsilon:"ϵ",straightphi:"ϕ",strns:"¯",sub:"⊂",Sub:"⋐",subdot:"⪽",subE:"⫅",sube:"⊆",subedot:"⫃",submult:"⫁",subnE:"⫋",subne:"⊊",subplus:"⪿",subrarr:"⥹",subset:"⊂",Subset:"⋐",subseteq:"⊆",subseteqq:"⫅",SubsetEqual:"⊆",subsetneq:"⊊",subsetneqq:"⫋",subsim:"⫇",subsub:"⫕",subsup:"⫓",succapprox:"⪸",succ:"≻",succcurlyeq:"≽",Succeeds:"≻",SucceedsEqual:"⪰",SucceedsSlantEqual:"≽",SucceedsTilde:"≿",succeq:"⪰",succnapprox:"⪺",succneqq:"⪶",succnsim:"⋩",succsim:"≿",SuchThat:"∋",sum:"∑",Sum:"∑",sung:"♪",sup1:"¹",sup2:"²",sup3:"³",sup:"⊃",Sup:"⋑",supdot:"⪾",supdsub:"⫘",supE:"⫆",supe:"⊇",supedot:"⫄",Superset:"⊃",SupersetEqual:"⊇",suphsol:"⟉",suphsub:"⫗",suplarr:"⥻",supmult:"⫂",supnE:"⫌",supne:"⊋",supplus:"⫀",supset:"⊃",Supset:"⋑",supseteq:"⊇",supseteqq:"⫆",supsetneq:"⊋",supsetneqq:"⫌",supsim:"⫈",supsub:"⫔",supsup:"⫖",swarhk:"⤦",swarr:"↙",swArr:"⇙",swarrow:"↙",swnwar:"⤪",szlig:"ß",Tab:"\t",target:"⌖",Tau:"Τ",tau:"τ",tbrk:"⎴",Tcaron:"Ť",tcaron:"ť",Tcedil:"Ţ",tcedil:"ţ",Tcy:"Т",tcy:"т",tdot:"⃛",telrec:"⌕",Tfr:"𝔗",tfr:"𝔱",there4:"∴",therefore:"∴",Therefore:"∴",Theta:"Θ",theta:"θ",thetasym:"ϑ",thetav:"ϑ",thickapprox:"≈",thicksim:"∼",ThickSpace:"  ",ThinSpace:" ",thinsp:" ",thkap:"≈",thksim:"∼",THORN:"Þ",thorn:"þ",tilde:"˜",Tilde:"∼",TildeEqual:"≃",TildeFullEqual:"≅",TildeTilde:"≈",timesbar:"⨱",timesb:"⊠",times:"×",timesd:"⨰",tint:"∭",toea:"⤨",topbot:"⌶",topcir:"⫱",top:"⊤",Topf:"𝕋",topf:"𝕥",topfork:"⫚",tosa:"⤩",tprime:"‴",trade:"™",TRADE:"™",triangle:"▵",triangledown:"▿",triangleleft:"◃",trianglelefteq:"⊴",triangleq:"≜",triangleright:"▹",trianglerighteq:"⊵",tridot:"◬",trie:"≜",triminus:"⨺",TripleDot:"⃛",triplus:"⨹",trisb:"⧍",tritime:"⨻",trpezium:"⏢",Tscr:"𝒯",tscr:"𝓉",TScy:"Ц",tscy:"ц",TSHcy:"Ћ",tshcy:"ћ",Tstrok:"Ŧ",tstrok:"ŧ",twixt:"≬",twoheadleftarrow:"↞",twoheadrightarrow:"↠",Uacute:"Ú",uacute:"ú",uarr:"↑",Uarr:"↟",uArr:"⇑",Uarrocir:"⥉",Ubrcy:"Ў",ubrcy:"ў",Ubreve:"Ŭ",ubreve:"ŭ",Ucirc:"Û",ucirc:"û",Ucy:"У",ucy:"у",udarr:"⇅",Udblac:"Ű",udblac:"ű",udhar:"⥮",ufisht:"⥾",Ufr:"𝔘",ufr:"𝔲",Ugrave:"Ù",ugrave:"ù",uHar:"⥣",uharl:"↿",uharr:"↾",uhblk:"▀",ulcorn:"⌜",ulcorner:"⌜",ulcrop:"⌏",ultri:"◸",Umacr:"Ū",umacr:"ū",uml:"¨",UnderBar:"_",UnderBrace:"⏟",UnderBracket:"⎵",UnderParenthesis:"⏝",Union:"⋃",UnionPlus:"⊎",Uogon:"Ų",uogon:"ų",Uopf:"𝕌",uopf:"𝕦",UpArrowBar:"⤒",uparrow:"↑",UpArrow:"↑",Uparrow:"⇑",UpArrowDownArrow:"⇅",updownarrow:"↕",UpDownArrow:"↕",Updownarrow:"⇕",UpEquilibrium:"⥮",upharpoonleft:"↿",upharpoonright:"↾",uplus:"⊎",UpperLeftArrow:"↖",UpperRightArrow:"↗",upsi:"υ",Upsi:"ϒ",upsih:"ϒ",Upsilon:"Υ",upsilon:"υ",UpTeeArrow:"↥",UpTee:"⊥",upuparrows:"⇈",urcorn:"⌝",urcorner:"⌝",urcrop:"⌎",Uring:"Ů",uring:"ů",urtri:"◹",Uscr:"𝒰",uscr:"𝓊",utdot:"⋰",Utilde:"Ũ",utilde:"ũ",utri:"▵",utrif:"▴",uuarr:"⇈",Uuml:"Ü",uuml:"ü",uwangle:"⦧",vangrt:"⦜",varepsilon:"ϵ",varkappa:"ϰ",varnothing:"∅",varphi:"ϕ",varpi:"ϖ",varpropto:"∝",varr:"↕",vArr:"⇕",varrho:"ϱ",varsigma:"ς",varsubsetneq:"⊊︀",varsubsetneqq:"⫋︀",varsupsetneq:"⊋︀",varsupsetneqq:"⫌︀",vartheta:"ϑ",vartriangleleft:"⊲",vartriangleright:"⊳",vBar:"⫨",Vbar:"⫫",vBarv:"⫩",Vcy:"В",vcy:"в",vdash:"⊢",vDash:"⊨",Vdash:"⊩",VDash:"⊫",Vdashl:"⫦",veebar:"⊻",vee:"∨",Vee:"⋁",veeeq:"≚",vellip:"⋮",verbar:"|",Verbar:"‖",vert:"|",Vert:"‖",VerticalBar:"∣",VerticalLine:"|",VerticalSeparator:"❘",VerticalTilde:"≀",VeryThinSpace:" ",Vfr:"𝔙",vfr:"𝔳",vltri:"⊲",vnsub:"⊂⃒",vnsup:"⊃⃒",Vopf:"𝕍",vopf:"𝕧",vprop:"∝",vrtri:"⊳",Vscr:"𝒱",vscr:"𝓋",vsubnE:"⫋︀",vsubne:"⊊︀",vsupnE:"⫌︀",vsupne:"⊋︀",Vvdash:"⊪",vzigzag:"⦚",Wcirc:"Ŵ",wcirc:"ŵ",wedbar:"⩟",wedge:"∧",Wedge:"⋀",wedgeq:"≙",weierp:"℘",Wfr:"𝔚",wfr:"𝔴",Wopf:"𝕎",wopf:"𝕨",wp:"℘",wr:"≀",wreath:"≀",Wscr:"𝒲",wscr:"𝓌",xcap:"⋂",xcirc:"◯",xcup:"⋃",xdtri:"▽",Xfr:"𝔛",xfr:"𝔵",xharr:"⟷",xhArr:"⟺",Xi:"Ξ",xi:"ξ",xlarr:"⟵",xlArr:"⟸",xmap:"⟼",xnis:"⋻",xodot:"⨀",Xopf:"𝕏",xopf:"𝕩",xoplus:"⨁",xotime:"⨂",xrarr:"⟶",xrArr:"⟹",Xscr:"𝒳",xscr:"𝓍",xsqcup:"⨆",xuplus:"⨄",xutri:"△",xvee:"⋁",xwedge:"⋀",Yacute:"Ý",yacute:"ý",YAcy:"Я",yacy:"я",Ycirc:"Ŷ",ycirc:"ŷ",Ycy:"Ы",ycy:"ы",yen:"¥",Yfr:"𝔜",yfr:"𝔶",YIcy:"Ї",yicy:"ї",Yopf:"𝕐",yopf:"𝕪",Yscr:"𝒴",yscr:"𝓎",YUcy:"Ю",yucy:"ю",yuml:"ÿ",Yuml:"Ÿ",Zacute:"Ź",zacute:"ź",Zcaron:"Ž",zcaron:"ž",Zcy:"З",zcy:"з",Zdot:"Ż",zdot:"ż",zeetrf:"ℨ",ZeroWidthSpace:"​",Zeta:"Ζ",zeta:"ζ",zfr:"𝔷",Zfr:"ℨ",ZHcy:"Ж",zhcy:"ж",zigrarr:"⇝",zopf:"𝕫",Zopf:"ℤ",Zscr:"𝒵",zscr:"𝓏",zwj:"‍",zwnj:"‌"}},{}],17:[function(require,module,exports){module.exports={Aacute:"Á",aacute:"á",Acirc:"Â",acirc:"â",acute:"´",AElig:"Æ",aelig:"æ",Agrave:"À",agrave:"à",amp:"&",AMP:"&",Aring:"Å",aring:"å",Atilde:"Ã",atilde:"ã",Auml:"Ä",auml:"ä",brvbar:"¦",Ccedil:"Ç",ccedil:"ç",cedil:"¸",cent:"¢",copy:"©",COPY:"©",curren:"¤",deg:"°",divide:"÷",Eacute:"É",eacute:"é",Ecirc:"Ê",ecirc:"ê",Egrave:"È",egrave:"è",ETH:"Ð",eth:"ð",Euml:"Ë",euml:"ë",frac12:"½",frac14:"¼",frac34:"¾",gt:">",GT:">",Iacute:"Í",iacute:"í",Icirc:"Î",icirc:"î",iexcl:"¡",Igrave:"Ì",igrave:"ì",iquest:"¿",Iuml:"Ï",iuml:"ï",laquo:"«",lt:"<",LT:"<",macr:"¯",micro:"µ",middot:"·",nbsp:" ",not:"¬",Ntilde:"Ñ",ntilde:"ñ",Oacute:"Ó",oacute:"ó",Ocirc:"Ô",ocirc:"ô",Ograve:"Ò",ograve:"ò",ordf:"ª",ordm:"º",Oslash:"Ø",oslash:"ø",Otilde:"Õ",otilde:"õ",Ouml:"Ö",ouml:"ö",para:"¶",plusmn:"±",pound:"£",quot:'"',QUOT:'"',raquo:"»",reg:"®",REG:"®",sect:"§",shy:"­",sup1:"¹",sup2:"²",sup3:"³",szlig:"ß",THORN:"Þ",thorn:"þ",times:"×",Uacute:"Ú",uacute:"ú",Ucirc:"Û",ucirc:"û",Ugrave:"Ù",ugrave:"ù",uml:"¨",Uuml:"Ü",uuml:"ü",Yacute:"Ý",yacute:"ý",yen:"¥",yuml:"ÿ"}},{}],18:[function(require,module,exports){module.exports={amp:"&",apos:"'",gt:">",lt:"<",quot:'"'}},{}],19:[function(require,module,exports){"use strict";function getDecodeCache(exclude){var i,ch,cache=decodeCache[exclude];if(cache)return cache;for(cache=decodeCache[exclude]=[],i=0;i<128;i++)ch=String.fromCharCode(i),cache.push(ch);for(i=0;i<exclude.length;i++)ch=exclude.charCodeAt(i),cache[ch]="%"+("0"+ch.toString(16).toUpperCase()).slice(-2);return cache}function decode(string,exclude){var cache;return"string"!=typeof exclude&&(exclude=decode.defaultChars),cache=getDecodeCache(exclude),string.replace(/(%[a-f0-9]{2})+/gi,function(seq){var i,l,b1,b2,b3,b4,chr,result="";for(i=0,l=seq.length;i<l;i+=3)b1=parseInt(seq.slice(i+1,i+3),16),b1<128?result+=cache[b1]:192===(224&b1)&&i+3<l&&(b2=parseInt(seq.slice(i+4,i+6),16),128===(192&b2))?(chr=b1<<6&1984|63&b2,result+=chr<128?"��":String.fromCharCode(chr),i+=3):224===(240&b1)&&i+6<l&&(b2=parseInt(seq.slice(i+4,i+6),16),b3=parseInt(seq.slice(i+7,i+9),16),128===(192&b2)&&128===(192&b3))?(chr=b1<<12&61440|b2<<6&4032|63&b3,result+=chr<2048||chr>=55296&&chr<=57343?"���":String.fromCharCode(chr),i+=6):240===(248&b1)&&i+9<l&&(b2=parseInt(seq.slice(i+4,i+6),16),b3=parseInt(seq.slice(i+7,i+9),16),b4=parseInt(seq.slice(i+10,i+12),16),128===(192&b2)&&128===(192&b3)&&128===(192&b4))?(chr=b1<<18&1835008|b2<<12&258048|b3<<6&4032|63&b4,chr<65536||chr>1114111?result+="����":(chr-=65536,result+=String.fromCharCode(55296+(chr>>10),56320+(1023&chr))),i+=9):result+="�";return result})}var decodeCache={};decode.defaultChars=";/?:@&=+$,#",decode.componentChars="",module.exports=decode},{}],20:[function(require,module,exports){"use strict";function getEncodeCache(exclude){var i,ch,cache=encodeCache[exclude];if(cache)return cache;for(cache=encodeCache[exclude]=[],i=0;i<128;i++)ch=String.fromCharCode(i),cache.push(/^[0-9a-z]$/i.test(ch)?ch:"%"+("0"+i.toString(16).toUpperCase()).slice(-2));for(i=0;i<exclude.length;i++)cache[exclude.charCodeAt(i)]=exclude[i];return cache}function encode(string,exclude,keepEscaped){var i,l,code,nextCode,cache,result="";for("string"!=typeof exclude&&(keepEscaped=exclude,exclude=encode.defaultChars),"undefined"==typeof keepEscaped&&(keepEscaped=!0),cache=getEncodeCache(exclude),i=0,l=string.length;i<l;i++)if(code=string.charCodeAt(i),keepEscaped&&37===code&&i+2<l&&/^[0-9a-f]{2}$/i.test(string.slice(i+1,i+3)))result+=string.slice(i,i+3),i+=2;else if(code<128)result+=cache[code];else if(code>=55296&&code<=57343){if(code>=55296&&code<=56319&&i+1<l&&(nextCode=string.charCodeAt(i+1),nextCode>=56320&&nextCode<=57343)){result+=encodeURIComponent(string[i]+string[i+1]),i++;continue}result+="%EF%BF%BD"}else result+=encodeURIComponent(string[i]);return result}var encodeCache={};encode.defaultChars=";/?:@&=+$,-_.!~*'()#",encode.componentChars="-_.!~*'()",module.exports=encode},{}],21:[function(require,module,exports){String.prototype.repeat||!function(){"use strict";var defineProperty=function(){try{var object={},$defineProperty=Object.defineProperty,result=$defineProperty(object,object,object)&&$defineProperty}catch(error){}return result}(),repeat=function(count){if(null==this)throw TypeError();var string=String(this),n=count?Number(count):0;if(n!=n&&(n=0),n<0||n==1/0)throw RangeError();for(var result="";n;)n%2==1&&(result+=string),n>1&&(string+=string),n>>=1;return result};defineProperty?defineProperty(String.prototype,"repeat",{value:repeat,configurable:!0,writable:!0}):String.prototype.repeat=repeat}()},{}]},{},[4])(4)});


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


if(!self.bigshot){bigshot={};bigshot.Object={extend:function(b,c){for(var a in c.prototype){if(b.prototype[a]){b.prototype[a]._super=c.prototype[a]}else{b.prototype[a]=c.prototype[a]}}},resolve:function(b){var e=b.split(".");var a=self;for(var d=0;d<e.length;++d){a=a[e[d]]}return a},validate:function(a,b){},alertr:function(b){var c="";for(var a in b){c+=a+":"+b[a]+"\n"}alert(c)},logr:function(b){var c="";for(var a in b){c+=a+":"+b[a]+"\n"}if(console){console.log(c)}}};bigshot.Browser=function(){this.requestAnimationFrameFunction=window.requestAnimationFrame||window.mozRequestAnimationFrame||window.webkitRequestAnimationFrame||window.msRequestAnimationFrame||function(b,a){return setTimeout(b,0)}};bigshot.Browser.prototype={removeAllChildren:function(a){a.innerHTML=""},mouseEnter:function(b){var a=this.isAChildOf;return function(c){var d=c.relatedTarget;if(this===d||a(this,d)){return}b.call(this,c)}},isAChildOf:function(b,a){if(b===a){return false}while(a&&a!==b){a=a.parentNode}return a===b},unregisterListener:function(d,b,c,a){if(typeof(d.removeEventListener)!="undefined"){d.removeEventListener(b,c,a)}else{if(typeof(d.detachEvent)!="undefined"){d.detachEvent("on"+b,c)}}},registerListener:function(a,b,d,c){if(typeof a.addEventListener!="undefined"){if(b==="mouseenter"){a.addEventListener("mouseover",this.mouseEnter(d),c)}else{if(b==="mouseleave"){a.addEventListener("mouseout",this.mouseEnter(d),c)}else{a.addEventListener(b,d,c)}}}else{if(typeof a.attachEvent!="undefined"){a.attachEvent("on"+b,d)}else{a["on"+b]=d}}},stopEventBubbling:function(a){if(a){if(a.stopPropagation){a.stopPropagation()}else{a.cancelBubble=true}}},stopEventBubblingHandler:function(){var a=this;return function(b){a.stopEventBubbling(b);return false}},stopMouseEventBubbling:function(a){this.registerListener(a,"mousedown",this.stopEventBubblingHandler(),false);this.registerListener(a,"mouseup",this.stopEventBubblingHandler(),false);this.registerListener(a,"mousemove",this.stopEventBubblingHandler(),false)},getElementSize:function(b){var a={};if(b.clientWidth){a.w=b.clientWidth}if(b.clientHeight){a.h=b.clientHeight}return a},browserIsViewporting:function(){if(window.innerWidth<=screen.width){return false}else{return true}},getDevicePixelScale:function(){if(this.browserIsViewporting()){return screen.width/window.innerWidth}else{return 1}},requestAnimationFrame:function(c,a){var b=this.requestAnimationFrameFunction;b(c,a)},getElementPosition:function(b){var a=new Object();a.x=0;a.y=0;var c=b;while(c){a.x+=c.offsetLeft;a.y+=c.offsetTop;if(c.clientLeft){a.x+=c.clientLeft}if(c.clientTop){a.y+=c.clientTop}if(c.x){a.x+=c.x}if(c.y){a.y+=c.y}c=c.offsetParent}return a},createXMLHttpRequest:function(){try{return new ActiveXObject("Msxml2.XMLHTTP")}catch(a){}try{return new ActiveXObject("Microsoft.XMLHTTP")}catch(a){}try{return new XMLHttpRequest()}catch(a){}alert("XMLHttpRequest not supported");return null},makeOpacityTransition:function(a,b){if(a.style.WebkitTransitionProperty!=undefined){a.style.opacity=1;a.style.WebkitTransitionProperty="opacity";a.style.WebkitTransitionTimingFunction="linear";a.style.WebkitTransitionDuration="1s";setTimeout(function(){a.addEventListener("webkitTransitionEnd",function(){b()});a.style.opacity=0},0)}else{a.style.opacity=0;b()}}};bigshot.EventDispatcher=function(){this.eventListeners={}};bigshot.EventDispatcher.prototype={addEventListener:function(a,b){if(this.eventListeners[a]==undefined){this.eventListeners[a]=new Array()}this.eventListeners[a].push(b)},removeEventListener:function(a,d){if(this.eventListeners[a]!=undefined){var c=this.eventListeners[a];for(var b=0;b<c.length;++b){if(c[b]===listener){c.splice(b,1);if(c.length==0){delete this.eventListeners[a]}break}}}},fireEvent:function(b,a){if(this.eventListeners[b]!=undefined){var d=this.eventListeners[b];for(var c=0;c<d.length;++c){d[c](a)}}}};bigshot.Event=function(b){this.bubbles=false;this.cancelable=false;this.currentTarget=null;this.defaultPrevented=false;this.target=null;this.timeStamp=new Date().getTime();this.type=null;this.isTrusted=false;for(var a in b){this[a]=b[a]}};bigshot.Event.prototype={preventDefault:function(){this.defaultPrevented=true}};bigshot.TimedWeakReference=function(b,c,a){this.object=null;this.hasObject=false;this.fnCreate=b;this.fnDispose=c;this.lastAccess=new Date().getTime();this.hasTimer=false;this.interval=a};bigshot.TimedWeakReference.prototype={dispose:function(){this.clear()},get:function(){if(!this.hasObject){this.hasObject=true;this.object=this.fnCreate();this.startTimer()}this.lastAccess=new Date().getTime();return this.object},clear:function(){if(this.hasObject){this.hasObject=false;this.fnDispose(this.object);this.object=null;this.stopTimer()}},stopTimer:function(){if(this.hasTimer){clearTimeout(this.timerId);this.hasTimer=false}},startTimer:function(){if(!this.hasTimer){var a=this;this.hasTimer=true;this.timerId=setTimeout(function(){a.hasTimer=false;a.update()},this.interval)}},update:function(){if(this.hasObject){var a=new Date().getTime();if(a-this.lastAccess>this.interval){this.clear()}else{this.startTimer()}}}};bigshot.ImageEvent=function(a){bigshot.Event.call(this,a)};bigshot.ImageEvent.prototype={};bigshot.Object.extend(bigshot.ImageEvent,bigshot.Event);bigshot.VREvent=function(a){bigshot.Event.call(this,a)};bigshot.VREvent.prototype={};bigshot.Object.extend(bigshot.VREvent,bigshot.Event);bigshot.FullScreen=function(a){this.container=a;this.isFullScreen=false;this.savedBodyStyle=null;this.savedParent=null;this.savedSize=null;this.expanderDiv=null;this.restoreSize=false;this.onCloseHandlers=new Array();this.onResizeHandlers=new Array();var b=function(d,e){for(var c=0;c<e.length;++c){if(d[e[c]]){return e[c]}}return null};this.requestFullScreen=b(a,["requestFullScreen","mozRequestFullScreen","webkitRequestFullScreen"]);this.cancelFullScreen=b(document,["cancelFullScreen","mozCancelFullScreen","webkitCancelFullScreen"]);this.restoreSize=this.requestFullScreen!=null};bigshot.FullScreen.prototype={browser:new bigshot.Browser(),getRootElement:function(){return this.div},addOnClose:function(a){this.onCloseHandlers.push(a)},onClose:function(){for(var a=0;a<this.onCloseHandlers.length;++a){this.onCloseHandlers[a]()}},addOnResize:function(a){this.onResizeHandlers.push(a)},onResize:function(){for(var a=0;a<this.onResizeHandlers.length;++a){this.onResizeHandlers[a]()}},open:function(){this.isFullScreen=true;if(this.requestFullScreen){return this.openRequestFullScreen()}else{return this.openCompat()}},openRequestFullScreen:function(){this.savedSize={width:this.container.style.width,height:this.container.style.height};this.container.style.width="100%";this.container.style.height="100%";var a=this;if(this.requestFullScreen=="mozRequestFullScreen"){var c=function(){a.container.removeEventListener("mozfullscreenerror",c);a.isFullScreen=false;a.exitFullScreenHandler();a.onClose()};this.container.addEventListener("mozfullscreenerror",c);var b=function(){if(document.mozFullScreenElement!==a.container){document.removeEventListener("mozfullscreenchange",b);a.exitFullScreenHandler()}else{a.onResize()}};document.addEventListener("mozfullscreenchange",b)}else{var b=function(){if(document.webkitCurrentFullScreenElement!==a.container){a.container.removeEventListener("webkitfullscreenchange",b);a.exitFullScreenHandler()}else{a.onResize()}};this.container.addEventListener("webkitfullscreenchange",b)}this.exitFullScreenHandler=function(){if(a.isFullScreen){a.isFullScreen=false;document[a.cancelFullScreen]();if(a.restoreSize){a.container.style.width=a.savedSize.width;a.container.style.height=a.savedSize.height}a.onResize();a.onClose()}};this.container[this.requestFullScreen]()},openCompat:function(){this.savedParent=this.container.parentNode;this.savedSize={width:this.container.style.width,height:this.container.style.height};this.savedBodyStyle=document.body.style.cssText;document.body.style.overflow="hidden";this.expanderDiv=document.createElement("div");this.expanderDiv.style.position="absolute";this.expanderDiv.style.top="0px";this.expanderDiv.style.left="0px";this.expanderDiv.style.width=Math.max(window.innerWidth,document.documentElement.clientWidth)+"px";this.expanderDiv.style.height=Math.max(window.innerHeight,document.documentElement.clientHeight)+"px";document.body.appendChild(this.expanderDiv);this.div=document.createElement("div");this.div.style.position="fixed";this.div.style.top=window.pageYOffset+"px";this.div.style.left=window.pageXOffset+"px";this.div.style.width=window.innerWidth+"px";this.div.style.height=window.innerHeight+"px";this.div.style.zIndex=9998;this.div.appendChild(this.container);document.body.appendChild(this.div);var c=this;var b=function(f){setTimeout(function(){c.div.style.width=window.innerWidth+"px";c.div.style.height=window.innerHeight+"px";setTimeout(function(){c.onResize()},1)},1)};var d=function(f){c.expanderDiv.style.width=Math.max(window.innerWidth,document.documentElement.clientWidth)+"px";c.expanderDiv.style.height=Math.max(window.innerHeight,document.documentElement.clientHeight)+"px";setTimeout(function(){c.div.style.top=window.pageYOffset+"px";c.div.style.left=window.pageXOffset+"px";c.div.style.width=window.innerWidth+"px";c.div.style.height=window.innerHeight+"px";setTimeout(function(){c.onResize()},1)},1)};var a=function(f){if(f.keyCode==27){c.exitFullScreenHandler()}};this.exitFullScreenHandler=function(){c.isFullScreen=false;c.browser.unregisterListener(document,"keydown",a);c.browser.unregisterListener(window,"resize",b);c.browser.unregisterListener(document.body,"orientationchange",d);if(c.restoreSize){c.container.style.width=c.savedSize.width;c.container.style.height=c.savedSize.height}document.body.style.cssText=c.savedBodyStyle;c.savedParent.appendChild(c.container);document.body.removeChild(c.div);document.body.removeChild(c.expanderDiv);c.onResize();c.onClose();setTimeout(function(){c.onResize()},1)};this.browser.registerListener(document,"keydown",a,false);this.browser.registerListener(window,"resize",b,false);this.browser.registerListener(document.body,"orientationchange",d,false);this.onResize();return this.exitFullScreenHandler},close:function(){this.exitFullScreenHandler()}};bigshot.DataLoader=function(){};bigshot.DataLoader.prototype={loadImage:function(a,b){},loadXml:function(a,b,c){}};bigshot.DefaultDataLoader=function(b,a){this.maxRetries=b;this.crossOrigin=a;if(!this.maxRetries){this.maxRetries=0}};bigshot.DefaultDataLoader.prototype={browser:new bigshot.Browser(),loadImage:function(a,d){var c=document.createElement("img");c.retries=0;if(this.crossOrigin!=null){c.crossOrigin=this.crossOrigin}var b=this;this.browser.registerListener(c,"load",function(){if(d){d(c)}},false);this.browser.registerListener(c,"error",function(){c.retries++;if(c.retries<=b.maxRetries){setTimeout(function(){c.src=a},c.retries*1000)}else{if(d){d(null)}}},false);c.src=a;return c},loadXml:function(c,a,f){for(var e=0;e<=this.maxRetries;++e){var d=this.browser.createXMLHttpRequest();d.open("GET",c,false);d.send(null);if(d.status==200){var b=d.responseXML;if(b!=null){if(f){f(b)}return b}}if(e==that.maxRetries){if(f){f(null)}return null}}}};bigshot.Object.validate("bigshot.DefaultDataLoader",bigshot.DataLoader);bigshot.CachingDataLoader=function(){this.cache={};this.requested={};this.requestedTiles={}};bigshot.CachingDataLoader.prototype={browser:new bigshot.Browser(),loadImage:function(a,d){if(this.cache[a]){if(d){d(this.cache[a])}return this.cache[a]}else{if(this.requested[a]){if(d){this.requested[a].push(d)}return this.requestedTiles[a]}else{var c=this;this.requested[a]=new Array();if(d){this.requested[a].push(d)}var b=document.createElement("img");this.requestedTiles[a]=b;this.browser.registerListener(b,"load",function(){var f=c.requested[a];delete c.requested[a];delete c.requestedTiles[a];c.cache[a]=b;for(var e=0;e<f.length;++e){f[e](b)}},false);b.src=a;return b}}},loadXml:function(a,c,f){if(this.cache[a]){if(f){f(this.cache[a])}return this.cache[a]}else{if(this.requested[a]&&c){if(f){this.requested[a].push(f)}}else{var e=this.browser.createXMLHttpRequest();if(!this.requested[a]){this.requested[a]=new Array()}if(c){if(f){this.requested[a].push(f)}}var d=this;var b=function(){if(d.requested[a]){var g=null;if(e.status==200){g=e.responseXML}var k=d.requested[a];delete d.requested[a];d.cache[a]=g;for(var j=0;j<k.length;++j){k[j](g)}}return g};if(c){e.onreadystatechange=function(){if(e.readyState==4){b()}};e.open("GET",a,true);e.send()}else{e.open("GET",a,false);e.send();return b()}}}}};bigshot.Object.validate("bigshot.CachingDataLoader",bigshot.DataLoader);bigshot.Hotspot=function(a,e,b,d){var c=document.createElement("div");c.style.position="absolute";c.style.overflow="visible";this.element=c;this.x=a;this.y=e;this.w=b;this.h=d};bigshot.Hotspot.prototype={browser:new bigshot.Browser(),layout:function(c,e,d){var g=this.x*d+c;var f=this.y*d+e;var a=this.w*d;var b=this.h*d;this.element.style.top=f+"px";this.element.style.left=g+"px";this.element.style.width=a+"px";this.element.style.height=b+"px"},getElement:function(){return this.element}};bigshot.PointHotspot=function(a,i,b,e,f,g,c){bigshot.Hotspot.call(this,a,i,b,e);this.xo=f;this.yo=g;if(c){var d=this.getElement();d.style.backgroundImage="url('"+c+"')";d.style.backgroundRepeat="no-repeat"}};bigshot.PointHotspot.prototype={getLabel:function(){return this.label},layout:function(a,c,b){var e=this.x*b+a+this.xo;var d=this.y*b+c+this.yo;this.element.style.top=d+"px";this.element.style.left=e+"px";this.element.style.width=this.w+"px";this.element.style.height=this.h+"px"}};bigshot.Object.extend(bigshot.PointHotspot,bigshot.Hotspot);bigshot.Layer=function(){};bigshot.Layer.prototype={getContainer:function(){},setMaxTiles:function(a,b){},resize:function(a,b){},layout:function(g,e,f,a,d,c,i,b){}};bigshot.LabeledHotspot=function(a,e,b,c,d){bigshot.Hotspot.call(this,a,e,b,c);this.label=document.createElement("div");this.label.style.position="relative";this.label.style.display="inline-block";this.getElement().appendChild(this.label);this.label.innerHTML=d;this.labelSize=this.browser.getElementSize(this.label)};bigshot.LabeledHotspot.prototype={getLabel:function(){return this.label},layout:function(c,e,d){this.layout._super.call(this,c,e,d);var a=this.w*d;var b=this.h*d;this.label.style.top=(b+4)+"px";this.label.style.left=((a-this.labelSize.w)/2)+"px"}};bigshot.Object.extend(bigshot.LabeledHotspot,bigshot.Hotspot);bigshot.LinkHotspot=function(a,f,b,d,e,c){bigshot.LabeledHotspot.call(this,a,f,b,d,e);this.browser.registerListener(this.getElement(),"click",function(){document.location.href=c})};bigshot.Object.extend(bigshot.LinkHotspot,bigshot.LabeledHotspot);bigshot.HotspotLayer=function(a){this.image=a;this.hotspots=new Array();this.browser=new bigshot.Browser();this.container=a.createLayerContainer();this.parentContainer=a.getContainer();this.resize(0,0)};bigshot.HotspotLayer.prototype={getContainer:function(){return this.container},resize:function(a,b){this.container.style.width=this.parentContainer.clientWidth+"px";this.container.style.height=this.parentContainer.clientHeight+"px"},layout:function(k,d,j,e,a,l,b,g){var c=Math.pow(2,this.image.getZoom());d-=b*e;j-=b*a;for(var f=0;f<this.hotspots.length;++f){this.hotspots[f].layout(d,j,c)}},setMaxTiles:function(b,a){},addHotspot:function(a){this.container.appendChild(a.getElement());this.hotspots.push(a)}};bigshot.Object.validate("bigshot.HotspotLayer",bigshot.Layer);bigshot.TileLayer=function(d,c,a,b,e){this.rows=new Array();this.browser=new bigshot.Browser();this.container=d.createLayerContainer();this.parentContainer=d.getContainer();this.parameters=c;this.w=a;this.h=b;this.imageTileCache=e;this.resize(a,b);return this};bigshot.TileLayer.prototype={getContainer:function(){return this.container},resize:function(a,d){this.container.style.width=this.parentContainer.clientWidth+"px";this.container.style.height=this.parentContainer.clientHeight+"px";this.pixelWidth=this.parentContainer.clientWidth;this.pixelHeight=this.parentContainer.clientHeight;this.w=a;this.h=d;this.rows=new Array();this.browser.removeAllChildren(this.container);for(var f=0;f<d;++f){var g=new Array();for(var i=0;i<a;++i){var b=document.createElement("div");b.style.position="absolute";b.style.overflow="hidden";b.style.width=this.container.clientWidth+"px";b.style.height=this.container.clientHeight+"px";var e=document.createElement("div");e.style.position="relative";e.style.border="hidden";e.style.visibility="hidden";e.bigshotData={visible:false};g.push(e);this.container.appendChild(b);b.appendChild(e)}this.rows.push(g)}},layout:function(a,p,d,z,f,m,o,e){a=Math.min(0,Math.ceil(a));this.imageTileCache.resetUsed();var g=d;var b=0;for(var k=0;k<this.h;++k){var i=p;for(var s=0;s<this.w;++s){var v=this.rows[k][s];var j=v.bigshotData;if(i+m<0||i>this.pixelWidth||g+m<0||g>this.pixelHeight){if(j.visible){j.visible=false;v.style.visibility="hidden"}}else{b++;v.style.left=i+"px";v.style.top=g+"px";v.style.width=m+"px";v.style.height=m+"px";v.style.opacity=e;if(!j.visible){j.visible=true;v.style.visibility="visible"}var u=s+z;var t=k+f;if(this.parameters.wrapX){if(u<0||u>=this.imageTileCache.maxTileX){u=(u+this.imageTileCache.maxTileX)%this.imageTileCache.maxTileX}}if(this.parameters.wrapY){if(t<0||t>=this.imageTileCache.maxTileY){t=(t+this.imageTileCache.maxTileY)%this.imageTileCache.maxTileY}}var n=u+"_"+t+"_"+a;var q=u<0||u>=this.imageTileCache.maxTileX||t<0||t>=this.imageTileCache.maxTileY;if(q){if(!j.isOutside){var l=this.imageTileCache.getImage(u,t,a);this.browser.removeAllChildren(v);v.appendChild(l);j.image=l}j.isOutside=true;j.imageKey="EMPTY";j.image.style.width=m+"px";j.image.style.height=m+"px"}else{var l=this.imageTileCache.getImage(u,t,a);j.isOutside=false;if(j.imageKey!==n||j.isPartial){this.browser.removeAllChildren(v);v.appendChild(l);j.image=l;j.imageKey=n;j.isPartial=l.isPartial}j.image.style.width=m+"px";j.image.style.height=m+"px"}}i+=o}g+=o}},setMaxTiles:function(b,a){this.imageTileCache.setMaxTiles(b,a)}};bigshot.Object.validate("bigshot.TileLayer",bigshot.Layer);bigshot.LRUMap=function(){this.keyToTime={};this.counter=0;this.size=0};bigshot.LRUMap.prototype={access:function(a){this.remove(a);this.keyToTime[a]=this.counter;++this.counter;++this.size},remove:function(a){if(this.keyToTime[a]){delete this.keyToTime[a];--this.size;return true}else{return false}},getSize:function(){return this.size},leastUsed:function(){var b=this.counter+1;var c=null;for(var a in this.keyToTime){if(this.keyToTime[a]<b){b=this.keyToTime[a];c=a}}return c}};bigshot.ImageTileCache=function(d,a,c){var b=this;this.parameters=c;this.fullImage=null;c.dataLoader.loadImage(c.fileSystem.getPosterFilename(),function(e){b.fullImage=e;if(a){a()}});this.maxCacheSize=512;this.maxTileX=0;this.maxTileY=0;this.cachedImages={};this.requestedImages={};this.usedImages={};this.lastOnLoadFiredAt=0;this.imageRequests=0;this.lruMap=new bigshot.LRUMap();this.onLoaded=d;this.browser=new bigshot.Browser();this.partialImageSize=c.tileSize/4;this.POSTER_ZOOM_LEVEL=Math.log(c.posterSize/Math.max(c.width,c.height))/Math.log(2)};bigshot.ImageTileCache.prototype={resetUsed:function(){this.usedImages={}},setMaxTiles:function(b,a){this.maxTileX=b;this.maxTileY=a},getPartialImage:function(c,b,d){var a=this.getPartialImageFromDownsampled(c,b,d,0,0,this.parameters.tileSize,this.parameters.tileSize);if(a==null){a=this.getPartialImageFromPoster(c,b,d)}return a},getPartialImageFromPoster:function(d,c,e){if(this.fullImage&&this.fullImage.complete){var a=this.fullImage.width/this.parameters.width;var b=a*this.parameters.tileSize/Math.pow(2,e);x0=Math.floor(b*d);y0=Math.floor(b*c);w=Math.floor(b);h=Math.floor(b);return this.createPartialImage(this.fullImage,this.fullImage.width,x0,y0,w,h)}else{return null}},createPartialImage:function(f,k,b,p,q,g){var c=document.createElement("canvas");if(!c.width){return null}c.width=this.partialImageSize;c.height=this.partialImageSize;var r=c.getContext("2d");var d=f.width/k;var o=Math.floor(b*d);var n=Math.floor(p*d);var a=this.partialImageSize;var l=this.partialImageSize;q*=d;if(o+q>=f.width){var i=q;q=f.width-o;a*=q/i}g*=d;if(n+g>=f.height){var m=g;g=f.height-n;l*=g/m}try{r.drawImage(f,o,n,q,g,-0.1,-0.1,a+0.2,l+0.2)}catch(j){return null}return c},getPartialImageFromDownsampled:function(a,j,d,b,f,g,e){if(d<this.POSTER_ZOOM_LEVEL||d<this.parameters.minZoom){return null}var i=this.getImageKey(a,j,d);var c=this.cachedImages[i];if(c==null){this.requestImage(a,j,d)}if(c){return this.createPartialImage(c,this.parameters.tileSize,b,f,g,e)}else{g/=2;e/=2;b/=2;f/=2;if((a%2)==1){b+=this.parameters.tileSize/2}if((j%2)==1){f+=this.parameters.tileSize/2}a=Math.floor(a/2);j=Math.floor(j/2);--d;return this.getPartialImageFromDownsampled(a,j,d,b,f,g,e)}},getEmptyImage:function(){var a=document.createElement("img");if(this.parameters.emptyImage){a.src=this.parameters.emptyImage}else{a.src="data:image/gif,GIF89a%01%00%01%00%80%00%00%00%00%00%FF%FF%FF!%F9%04%00%00%00%00%00%2C%00%00%00%00%01%00%01%00%00%02%02D%01%00%3B"}return a},getImage:function(e,d,f){if(e<0||d<0||e>=this.maxTileX||d>=this.maxTileY){return this.getEmptyImage()}var b=this.getImageKey(e,d,f);this.lruMap.access(b);if(this.cachedImages[b]){if(this.usedImages[b]){var c=this.parameters.dataLoader.loadImage(this.getImageFilename(e,d,f));c.isPartial=false;return c}else{this.usedImages[b]=true;var a=this.cachedImages[b];return a}}else{this.requestImage(e,d,f);var a=this.getPartialImage(e,d,f);if(a!=null){a.isPartial=true;this.cachedImages[b]=a}else{a=this.getEmptyImage();if(a!=null){a.isPartial=true}}return a}},requestImage:function(d,c,e){var a=this.getImageKey(d,c,e);if(!this.requestedImages[a]){this.imageRequests++;var b=this;this.requestedImages[a]=true;this.parameters.dataLoader.loadImage(this.getImageFilename(d,c,e),function(f){delete b.requestedImages[a];b.imageRequests--;f.isPartial=false;b.cachedImages[a]=f;b.fireOnLoad()})}},fireOnLoad:function(){var a=new Date();if(this.imageRequests==0||a.getTime()>(this.lastOnLoadFiredAt+50)){this.purgeCache();this.lastOnLoadFiredAt=a.getTime();this.onLoaded()}},purgeCache:function(){for(var a=0;a<4;++a){if(this.lruMap.getSize()>this.maxCacheSize){var b=this.lruMap.leastUsed();this.lruMap.remove(b);delete this.cachedImages[b]}}},getImageKey:function(b,a,c){return"I"+b+"_"+a+"_"+c},getImageFilename:function(c,a,d){var b=this.parameters.fileSystem.getImageFilename(c,a,d);return b}};bigshot.ImageParameters=function(b){this.posterSize=0;this.emptyImage=null;this.suffix=null;this.width=0;this.height=0;this.container=null;this.minZoom=0;this.maxZoom=0;this.tileSize=0;this.overlap=0;this.wrapX=false;this.wrapY=false;this.basePath=null;this.fileSystemType="folder";this.fileSystem=null;this.dataLoader=new bigshot.DefaultDataLoader();this.touchUI=false;this.fling=true;this.maxTextureMagnification=1;if(b){for(var a in b){this[a]=b[a]}}this.merge=function(d,e){for(var c in d){if(e||!this[c]){this[c]=d[c]}}};return this};bigshot.ImageBase=function(b){bigshot.EventDispatcher.call(this);this.parameters=b;this.flying=0;this.container=b.container;this.x=b.width/2;this.y=b.height/2;this.zoom=0;this.width=b.width;this.height=b.height;this.minZoom=b.minZoom;this.maxZoom=b.maxZoom;this.tileSize=b.tileSize;this.overlap=0;this.imageTileCache=null;this.dragStart=null;this.dragged=false;this.layers=new Array();this.fullScreenHandler=null;this.currentGesture=null;var a=this;this.onresizeHandler=function(f){a.onresize()};var d=function(e){if(e.preventDefault){e.preventDefault()}return false};var c=function(e){if(e.clientX){return e}else{return{clientX:e.changedTouches[0].clientX,clientY:e.changedTouches[0].clientY,changedTouches:e.changedTouches}}};this.setupLayers();this.resize();this.allListeners={DOMMouseScroll:function(f){a.mouseWheel(f);return d(f)},mousewheel:function(f){a.mouseWheel(f);return d(f)},dblclick:function(f){a.mouseDoubleClick(f);return d(f)},mousedown:function(f){a.dragMouseDown(f);return d(f)},gesturestart:function(f){a.gestureStart(f);return d(f)},gesturechange:function(f){a.gestureChange(f);return d(f)},gestureend:function(f){a.gestureEnd(f);return d(f)},touchstart:function(f){a.dragMouseDown(c(f));return d(f)},mouseup:function(f){a.dragMouseUp(f);return d(f)},touchend:function(f){a.dragMouseUp(c(f));return d(f)},mousemove:function(f){a.dragMouseMove(f);return d(f)},mouseout:function(f){return d(f)},touchmove:function(f){a.dragMouseMove(c(f));return d(f)}};this.addEventListeners();this.browser.registerListener(window,"resize",a.onresizeHandler,false);this.zoomToFit()};bigshot.ImageBase.prototype={browser:new bigshot.Browser(),addEventListeners:function(){for(var a in this.allListeners){this.browser.registerListener(this.container,a,this.allListeners[a],false)}},removeEventListeners:function(){for(var a in this.allListeners){this.browser.unregisterListener(this.container,a,this.allListeners[a],false)}},setupLayers:function(){},getTextureStretch:function(){var a=Math.log(this.parameters.maxTextureMagnification/this.browser.getDevicePixelScale())/Math.LN2;return a},clampXY:function(j,g){var e=this.container.clientWidth;var d=this.container.clientHeight;var f=Math.pow(2,this.zoom);var b=e/f;var a=d/f;var i=function(m,o,n){var l=m/2;l=Math.min(o/2,l);if(n<l){n=l}var k=o-m/2;k=Math.max(o/2,k);if(n>k){n=k}return n};var c={};if(j!=null){c.x=i(b,this.width,j)}if(g!=null){c.y=i(a,this.height,g)}return c},layout:function(){var o=this.container.clientWidth;var c=this.container.clientHeight;var p=Math.min(this.maxZoom,Math.max(this.zoom-this.getTextureStretch(),this.minZoom));var l=Math.min(0,Math.ceil(p));var e=Math.pow(2,l);var m=this.clampXY(this.x,this.y);if(!this.parameters.wrapY){this.y=m.y}if(!this.parameters.wrapX){this.x=m.x}var u=this.tileSize/e;var j=Math.pow(2,this.zoom-l);var d=this.tileSize*j;var n=this.width/u;var k=this.height/u;var g=this.x/u;var f=this.y/u;var b=g-(o/2)/d;var a=f-(c/2)/d;var s=Math.floor(b);var r=Math.floor(a);var v=Math.round((b-s)*d);var t=Math.round((a-r)*d);for(var q=0;q<this.layers.length;++q){this.layers[q].layout(p,-v-d,-t-d,s-1,r-1,Math.ceil(d),Math.ceil(d),1)}},resize:function(){var c=Math.ceil(2*this.container.clientWidth/this.tileSize)+2;var a=Math.ceil(2*this.container.clientHeight/this.tileSize)+2;for(var b=0;b<this.layers.length;++b){this.layers[b].resize(c,a)}},createLayerContainer:function(){var a=document.createElement("div");a.style.position="absolute";a.style.overflow="hidden";return a},getContainer:function(){return this.container},addLayer:function(a){this.container.appendChild(a.getContainer());this.layers.push(a)},clampZoom:function(a){return Math.min(this.maxZoom,Math.max(a,this.minZoom))},setZoom:function(c,e){this.zoom=this.clampZoom(c);var g=Math.ceil(this.zoom-this.getTextureStretch());var b=Math.pow(2,g);var f=Math.ceil(b*this.width/this.tileSize);var d=Math.ceil(b*this.height/this.tileSize);for(var a=0;a<this.layers.length;++a){this.layers[a].setMaxTiles(f,d)}if(e){this.layout()}},setMaxZoom:function(a){this.maxZoom=a},getMaxZoom:function(){return this.maxZoom},setMinZoom:function(a){this.minZoom=a},getMinZoom:function(){return this.minZoom},adjustCoordinateForZoom:function(e,a,d,c){var b=Math.pow(2,d)/Math.pow(2,c);return a+(e-a)*b},gestureStart:function(a){this.currentGesture={startZoom:this.zoom,scale:a.scale}},gestureEnd:function(a){this.currentGesture=null;if(this.dragStart){this.dragStart.hadGesture=true}},gestureChange:function(d){if(this.currentGesture){if(this.dragStart){this.dragStart.hadGesture=true}var c=this.clampZoom(this.currentGesture.startZoom+Math.log(d.scale)/Math.log(2));var e=this.getZoom();if(this.currentGesture.clientX!==undefined&&this.currentGesture.clientY!==undefined){var b=this.clientToImage(this.currentGesture.clientX,this.currentGesture.clientY);var a=this.adjustCoordinateForZoom(this.x,b.x,e,c);var f=this.adjustCoordinateForZoom(this.y,b.y,e,c);this.moveTo(a,f,c)}else{this.setZoom(c);this.layout()}}},dragMouseDown:function(a){this.dragStart={x:a.clientX,y:a.clientY};this.dragLast={clientX:a.clientX,clientY:a.clientY,dx:0,dy:0,dt:1000000,time:new Date().getTime()};this.dragged=false},dragMouseMove:function(a){if(this.currentGesture!=null&&a.changedTouches!=null&&a.changedTouches.length>0){var e=0;var d=0;for(var j=0;j<a.changedTouches.length;++j){e+=a.changedTouches[j].clientX;d+=a.changedTouches[j].clientY}this.currentGesture.clientX=e/a.changedTouches.length;this.currentGesture.clientY=d/a.changedTouches.length}if(this.currentGesture==null&&this.dragStart!=null){var k={x:a.clientX-this.dragStart.x,y:a.clientY-this.dragStart.y};if(k.x!=0||k.y!=0){this.dragged=true}var c=Math.pow(2,this.zoom);var g=k.x/c;var f=k.y/c;this.dragStart={x:a.clientX,y:a.clientY};var b=new Date().getTime()-this.dragLast.time;if(b>20){this.dragLast={dx:this.dragLast.clientX-a.clientX,dy:this.dragLast.clientY-a.clientY,dt:b,clientX:a.clientX,clientY:a.clientY,time:new Date().getTime()}}this.moveTo(this.x-g,this.y-f)}},dragMouseUp:function(a){if(this.currentGesture==null&&!this.dragStart.hadGesture&&this.dragStart!=null){this.dragStart=null;if(!this.dragged){this.mouseClick(a)}else{var e=Math.pow(2,this.zoom);var j=this.dragLast.dx/e;var i=this.dragLast.dy/e;var d=Math.sqrt(j*j+i*i);var c=this.dragLast.dt;var b=new Date().getTime()-this.dragLast.time;this.dragLast=null;var g=c>0?(d/c):0;if(g>0.05&&b<250&&c>20&&this.parameters.fling){var f=new Date().getTime();j/=c;i/=c;this.flyTo(this.x+j*250,this.y+i*250,this.zoom)}}}},mouseDoubleClick:function(b){var a=this.createImageEventData({type:"dblclick",clientX:b.clientX,clientY:b.clientY});this.fireEvent("dblclick",a);if(!a.defaultPrevented){this.flyTo(a.imageX,a.imageY,this.zoom+0.5)}},getZoom:function(){return this.zoom},moveTo:function(a,d,b,c){this.stopFlying();if(a!=null||d!=null){this.setPosition(a,d,false)}if(b!=null){this.setZoom(b,false)}if(c==undefined||c==true){this.layout()}},setPosition:function(a,d,c){var b=this.clampXY(a,d);if(a!=null){if(this.parameters.wrapX){if(a<0||a>=this.width){a=(a+this.width)%this.width}}else{a=b.x}this.x=Math.max(0,Math.min(this.width,a))}if(d!=null){if(this.parameters.wrapY){if(d<0||d>=this.height){d=(d+this.height)%this.height}}else{d=b.y}this.y=Math.max(0,Math.min(this.height,d))}if(c!=false){this.layout()}},fitZoom:function(c,a){var b=a/c;return Math.log(b)/Math.LN2},getZoomToFitValue:function(){return Math.min(this.fitZoom(this.parameters.width,this.container.clientWidth),this.fitZoom(this.parameters.height,this.container.clientHeight))},getZoomToFillValue:function(){return Math.max(this.fitZoom(this.parameters.width,this.container.clientWidth),this.fitZoom(this.parameters.height,this.container.clientHeight))},zoomToFit:function(){this.moveTo(null,null,this.getZoomToFitValue())},zoomToFill:function(){this.moveTo(null,null,this.getZoomToFillValue())},zoomToFitHeight:function(){this.moveTo(null,null,this.fitZoom(this.parameters.height,this.container.clientHeight))},zoomToFitWidth:function(){this.moveTo(null,null,this.fitZoom(this.parameters.width,this.container.clientWidth))},flyZoomToFitHeight:function(){this.flyTo(null,this.parameters.height/2,this.fitZoom(this.parameters.height,this.container.clientHeight))},flyZoomToFitWidth:function(){this.flyTo(this.parameters.width/2,null,this.fitZoom(this.parameters.width,this.container.clientWidth))},flyZoomToFit:function(){this.flyTo(this.parameters.width/2,this.parameters.height/2,this.getZoomToFitValue())},clientToImage:function(c,a){var b=Math.pow(2,this.zoom);return{x:(c-this.container.clientWidth/2)/b+this.x,y:(a-this.container.clientHeight/2)/b+this.y}},mouseWheelHandler:function(g,d){var e=false;if(g>0){e=0.5}else{if(g<0){e=-0.5}}if(e){var b=this.clientToImage(d.clientX,d.clientY);var c=Math.min(this.maxZoom,Math.max(this.getZoom()+e,this.minZoom));var a=this.adjustCoordinateForZoom(this.x,b.x,this.getZoom(),c);var f=this.adjustCoordinateForZoom(this.y,b.y,this.getZoom(),c);this.flyTo(a,f,c,true)}},mouseWheel:function(a){var b=0;if(!a){a=window.event}if(a.wheelDelta){b=a.wheelDelta/120;if(window.opera){b=-b}}else{if(a.detail){b=-a.detail}}if(b){this.mouseWheelHandler(b,a)}if(a.preventDefault){a.preventDefault()}a.returnValue=false},onresize:function(){this.resize();this.layout()},getX:function(){return this.x},getY:function(){return this.y},stopFlying:function(){this.flying++},flyTo:function(m,l,q,e){var g=this;m=m!=null?m:this.x;l=l!=null?l:this.y;q=q!=null?q:this.zoom;e=e!=null?e:false;var d=this.x;var c=this.y;var o=this.zoom;var n=this.clampXY(m,l);var k=this.parameters.wrapX?m:n.x;var i=this.parameters.wrapY?l:n.y;var b=Math.min(this.maxZoom,Math.max(q,this.minZoom));this.flying++;var a=this.flying;var f=new Date().getTime();var p=function(z,x,t,s,r){var y=(x-z);var v=-y*Math.pow(2,-t*s);var u=t*r;if(y<0){v=Math.max(0,v-u)}else{v=Math.min(0,v+u)}return x+v};var j=function(){if(g.flying==a){var u=(new Date().getTime()-f)/1000;var r=p(d,k,u,e?10:4,e?0.2:1);var x=p(c,i,u,e?10:4,e?0.2:1);var v=p(o,b,u,10,0.2);var s=true;var t=Math.min(Math.pow(2,g.getZoom()),1);if(Math.abs(r-k)<(0.5*t)){r=k}else{s=false}if(Math.abs(x-i)<(0.5*t)){x=i}else{s=false}if(Math.abs(v-b)<0.02){v=b}else{s=false}g.setPosition(r,x,false);g.setZoom(v,false);g.layout();if(!s){g.browser.requestAnimationFrame(j,g.container)}}};this.browser.requestAnimationFrame(j,this.container)},rectVisibleAtZoomLevel:function(a,b){return Math.min(this.fitZoom(a,this.container.clientWidth),this.fitZoom(b,this.container.clientHeight))},getTouchAreaBaseSize:function(){var a=((this.container.clientWidth+this.container.clientHeight)/2)*0.2;return Math.min(a,Math.min(this.container.clientWidth,this.container.clientHeight)/6)},createImageEventData:function(b){var a=this.browser.getElementPosition(this.container);b.localX=b.clientX-a.x;b.localY=b.clientY-a.y;var c=Math.pow(2,this.zoom);b.imageX=(b.localX-this.container.clientWidth/2)/c+this.x;b.imageY=(b.localY-this.container.clientHeight/2)/c+this.y;b.target=this;b.currentTarget=this;return new bigshot.ImageEvent(b)},mouseClick:function(b){var a=this.createImageEventData({type:"click",clientX:b.clientX,clientY:b.clientY});this.fireEvent("click",a)},showTouchUI:function(f,g){if(!f){f=2500}if(!g){g=1000}var a=this.getTouchAreaBaseSize();var m=this.getTouchAreaBaseSize();var e=this.container.clientWidth/2;var d=this.container.clientHeight/2;var n=document.createElement("div");n.style.position="absolute";n.style.zIndex="9999";n.style.opacity=0.9;n.style.width=this.container.clientWidth+"px";n.style.height=this.container.clientHeight+"px";var b=document.createElement("div");b.style.position="absolute";var l=document.createElement("div");l.style.position="relative";l.style.background="black";l.style.textAlign="center";l.style.top=(d-m)+"px";l.style.left=(e-m)+"px";l.style.width=(2*m)+"px";l.style.height=(2*m)+"px";n.appendChild(b);b.appendChild(l);l.innerHTML="<span style='display:inline-box; position:relative; vertical-align:middle; font-size: 20pt; top: 10pt; color:white'>ZOOM IN</span>";var c=document.createElement("div");c.style.position="absolute";var k=document.createElement("div");k.style.position="relative";k.style.border=a+"px solid black";k.style.top="0px";k.style.left="0px";k.style.textAlign="center";k.style.width=this.container.clientWidth+"px";k.style.height=this.container.clientHeight+"px";k.style.MozBoxSizing=k.style.boxSizing=k.style.WebkitBoxSizing="border-box";k.innerHTML="<span style='position:relative; font-size: 20pt; top: -25pt; color:white'>ZOOM OUT</span>";c.appendChild(k);n.appendChild(c);this.container.appendChild(n);var j=this;var i=0.9;var p=g/50;if(p<1){p=1}var o=function(){i=i-(0.9/p);if(i<0){j.container.removeChild(n)}else{n.style.opacity=i;setTimeout(o,50)}};setTimeout(o,f)},exitFullScreen:function(){if(this.fullScreenHandler){this.removeEventListeners();this.fullScreenHandler.close();this.addEventListeners();this.fullScreenHandler=null;return}},fullScreen:function(a){if(this.fullScreenHandler){return}var c=document.createElement("div");c.style.position="absolute";c.style.fontSize="16pt";c.style.top="128px";c.style.width="100%";c.style.color="white";c.style.padding="16px";c.style.zIndex="9999";c.style.textAlign="center";c.style.opacity="0.75";c.innerHTML="<span style='border-radius: 16px; -moz-border-radius: 16px; padding: 16px; padding-left: 32px; padding-right: 32px; background:black'>Press Esc to exit full screen mode.</span>";var b=this;this.fullScreenHandler=new bigshot.FullScreen(this.container);this.fullScreenHandler.restoreSize=true;this.fullScreenHandler.addOnResize(function(){if(b.fullScreenHandler&&b.fullScreenHandler.isFullScreen){b.container.style.width=window.innerWidth+"px";b.container.style.height=window.innerHeight+"px"}b.onresize()});this.fullScreenHandler.addOnClose(function(){if(c.parentNode){try{div.removeChild(c)}catch(d){}}b.fullScreenHandler=null});if(a){this.fullScreenHandler.addOnClose(function(){a()})}this.removeEventListeners();this.fullScreenHandler.open();this.addEventListeners();if(this.fullScreenHandler.getRootElement()){this.fullScreenHandler.getRootElement().appendChild(c);setTimeout(function(){var e=0.75;var d=function(){e-=0.02;if(c.parentNode){if(e<=0){try{div.removeChild(c)}catch(f){}}else{c.style.opacity=e;setTimeout(d,20)}}};setTimeout(d,20)},3500)}return function(){b.fullScreenHandler.close()}},dispose:function(){this.browser.unregisterListener(window,"resize",this.onresizeHandler,false);this.removeEventListeners()}};bigshot.Object.extend(bigshot.ImageBase,bigshot.EventDispatcher);bigshot.Image=function(a){bigshot.setupFileSystem(a);a.merge(a.fileSystem.getDescriptor(),false);bigshot.ImageBase.call(this,a)};bigshot.Image.prototype={setupLayers:function(){var a=this;this.thisTileCache=new bigshot.ImageTileCache(function(){a.layout()},null,this.parameters);this.addLayer(new bigshot.TileLayer(this,this.parameters,0,0,this.thisTileCache))}};bigshot.Object.extend(bigshot.Image,bigshot.ImageBase);bigshot.HTMLElementLayer=function(d,b,c,a){this.hotspots=new Array();this.browser=new bigshot.Browser();this.image=d;this.container=d.createLayerContainer();this.parentContainer=d.getContainer();this.element=b;this.parentContainer.appendChild(b);this.w=c;this.h=a;this.resize(0,0)};bigshot.HTMLElementLayer.prototype={getContainer:function(){return this.container},resize:function(a,b){this.container.style.width=this.parentContainer.clientWidth+"px";this.container.style.height=this.parentContainer.clientHeight+"px"},layout:function(i,d,g,e,a,j,b,f){var c=Math.pow(2,this.image.getZoom());d-=b*e;g-=b*a;this.element.style.top=g+"px";this.element.style.left=d+"px";this.element.style.width=(this.w*c)+"px";this.element.style.height=(this.h*c)+"px"},setMaxTiles:function(b,a){}};bigshot.Object.validate("bigshot.HTMLElementLayer",bigshot.Layer);bigshot.HTMLDivElementLayer=function(e,b,c,a,f,d){this.wrapX=f;this.wrapY=d;this.hotspots=new Array();this.browser=new bigshot.Browser();this.image=e;this.container=e.createLayerContainer();this.parentContainer=e.getContainer();this.element=b;this.parentContainer.appendChild(b);this.w=c;this.h=a;this.resize(0,0)};bigshot.HTMLDivElementLayer.prototype={getContainer:function(){return this.container},resize:function(a,b){this.container.style.width=this.parentContainer.clientWidth+"px";this.container.style.height=this.parentContainer.clientHeight+"px"},layout:function(m,e,l,f,a,n,b,j){var d=Math.pow(2,this.image.getZoom());e-=b*f;l-=b*a;var c=(this.w*d);var k=(this.h*d);this.element.style.backgroundSize=c+"px "+k+"px";var i="0px";var g="0px";if(this.wrapY){this.element.style.top="0px";this.element.style.height=(this.parentContainer.clientHeight)+"px";g=l+"px"}else{this.element.style.top=l+"px";this.element.style.height=k+"px"}if(this.wrapX){this.element.style.left="0px";this.element.style.width=(this.parentContainer.clientWidth)+"px";i=e+"px"}else{this.element.style.left=e+"px";this.element.style.width=c+"px"}this.element.style.backgroundPosition=i+" "+g},setMaxTiles:function(b,a){}};bigshot.Object.validate("bigshot.HTMLDivElementLayer",bigshot.Layer);bigshot.SimpleImage=function(a,b){a.merge({fileSystem:null,fileSystemType:"simple",maxTextureMagnification:1,tileSize:1024},true);if(b){a.merge({width:b.width,height:b.height});this.imgElement=b}else{if(a.width==0||a.height==0){throw new Error("No imgElement and missing width or height in ImageParameters")}}bigshot.setupFileSystem(a);bigshot.ImageBase.call(this,a)};bigshot.SimpleImage.prototype={setupLayers:function(){if(!this.imgElement){this.imgElement=document.createElement("div");this.imgElement.style.backgroundImage="url('"+this.parameters.basePath+"')";this.imgElement.style.position="absolute";if(!this.parameters.wrapX&&!this.parameters.wrapY){this.imgElement.style.backgroundRepeat="no-repeat"}else{if(this.parameters.wrapX&&!this.parameters.wrapY){this.imgElement.style.backgroundRepeat="repeat-x"}else{if(!this.parameters.wrapX&&this.parameters.wrapY){this.imgElement.style.backgroundRepeat="repeat-y"}else{if(this.parameters.wrapX&&this.parameters.wrapY){this.imgElement.style.backgroundRepeat="repeat"}}}}}this.addLayer(new bigshot.HTMLDivElementLayer(this,this.imgElement,this.parameters.width,this.parameters.height,this.parameters.wrapX,this.parameters.wrapY))}};bigshot.Object.extend(bigshot.SimpleImage,bigshot.ImageBase);bigshot.FileSystem=function(){};bigshot.FileSystem.prototype={getFilename:function(a){},getImageFilename:function(b,a,c){},setPrefix:function(a){},getDescriptor:function(){},getPosterFilename:function(){}};bigshot.setupFileSystem=function(a){if(!a.fileSystem){if(a.fileSystemType=="archive"){a.fileSystem=new bigshot.ArchiveFileSystem(a)}else{if(a.fileSystemType=="dzi"){a.fileSystem=new bigshot.DeepZoomImageFileSystem(a)}else{if(a.fileSystemType=="simple"){a.fileSystem=new bigshot.SimpleFileSystem(a)}else{a.fileSystem=new bigshot.FolderFileSystem(a)}}}}};bigshot.SimpleFileSystem=function(a){this.parameters=a};bigshot.SimpleFileSystem.prototype={getDescriptor:function(){return{}},getPosterFilename:function(){return null},getFilename:function(a){return null},getImageFilename:function(b,a,c){return null},getPrefix:function(){return""},setPrefix:function(a){this.prefix=a}};bigshot.Object.validate("bigshot.SimpleFileSystem",bigshot.FileSystem);bigshot.FolderFileSystem=function(a){this.prefix=null;this.suffix="";this.parameters=a};bigshot.FolderFileSystem.prototype={getDescriptor:function(){this.browser=new bigshot.Browser();var b=this.browser.createXMLHttpRequest();b.open("GET",this.getFilename("descriptor"),false);b.send(null);var c={};if(b.status==200){var d=b.responseText.split(":");for(var a=0;a<d.length;a+=2){if(d[a]=="suffix"){c[d[a]]=d[a+1]}else{c[d[a]]=parseInt(d[a+1])}}this.suffix=c.suffix;return c}else{throw new Error("Unable to find descriptor.")}},getPosterFilename:function(){return this.getFilename("poster"+this.suffix)},setPrefix:function(a){this.prefix=a},getPrefix:function(){if(this.prefix){return this.prefix+"/"}else{return""}},getFilename:function(a){return this.parameters.basePath+"/"+this.getPrefix()+a},getImageFilename:function(c,b,d){var a=(-d)+"/"+c+"_"+b+this.suffix;return this.getFilename(a)}};bigshot.Object.validate("bigshot.FolderFileSystem",bigshot.FileSystem);bigshot.DeepZoomImageFileSystem=function(a){this.prefix="";this.suffix="";this.DZ_NAMESPACE="http://schemas.microsoft.com/deepzoom/2009";this.fullZoomLevel=0;this.posterName="";this.parameters=a};bigshot.DeepZoomImageFileSystem.prototype={getDescriptor:function(){var e={};var b=this.parameters.dataLoader.loadXml(this.parameters.basePath+this.prefix+".xml",false);var d=b.getElementsByTagName("Image")[0];var c=b.getElementsByTagName("Size")[0];e.width=parseInt(c.getAttribute("Width"));e.height=parseInt(c.getAttribute("Height"));e.tileSize=parseInt(d.getAttribute("TileSize"));e.overlap=parseInt(d.getAttribute("Overlap"));e.suffix="."+d.getAttribute("Format");e.posterSize=e.tileSize;this.suffix=e.suffix;this.fullZoomLevel=Math.ceil(Math.log(Math.max(e.width,e.height))/Math.LN2);e.minZoom=-this.fullZoomLevel;var a=Math.ceil(Math.log(e.tileSize)/Math.LN2);this.posterName=this.getImageFilename(0,0,a-this.fullZoomLevel);return e},setPrefix:function(a){this.prefix=a},getPosterFilename:function(){return this.posterName},getFilename:function(a){return this.parameters.basePath+this.prefix+"/"+a},getImageFilename:function(d,c,e){var a=this.fullZoomLevel+e;var b=a+"/"+d+"_"+c+this.suffix;return this.getFilename(b)}};bigshot.ArchiveFileSystem=function(d){this.indexSize=0;this.offset=0;this.index={};this.prefix="";this.suffix="";this.parameters=d;var a=new bigshot.Browser();var c=a.createXMLHttpRequest();c.open("GET",this.parameters.basePath+"&start=0&length=24&type=text/plain",false);c.send(null);if(c.status==200){if(c.responseText.substring(0,7)!="BIGSHOT"){alert('"'+this.parameters.basePath+'" is not a valid bigshot file');return}this.indexSize=parseInt(c.responseText.substring(8),16);this.offset=this.indexSize+24;c.open("GET",this.parameters.basePath+"&type=text/plain&start=24&length="+this.indexSize,false);c.send(null);if(c.status==200){var e=c.responseText.split(":");for(var b=0;b<e.length;b+=3){this.index[e[b]]={start:parseInt(e[b+1])+this.offset,length:parseInt(e[b+2])}}}else{alert('The index of "'+this.parameters.basePath+'" could not be loaded: '+c.status)}}else{alert('The header of "'+this.parameters.basePath+'" could not be loaded: '+c.status)}};bigshot.ArchiveFileSystem.prototype={getDescriptor:function(){this.browser=new bigshot.Browser();var b=this.browser.createXMLHttpRequest();b.open("GET",this.getFilename("descriptor"),false);b.send(null);var c={};if(b.status==200){var d=b.responseText.split(":");for(var a=0;a<d.length;a+=2){if(d[a]=="suffix"){c[d[a]]=d[a+1]}else{c[d[a]]=parseInt(d[a+1])}}this.suffix=c.suffix;return c}else{throw new Error("Unable to find descriptor.")}},getPosterFilename:function(){return this.getFilename("poster"+this.suffix)},getFilename:function(a){a=this.getPrefix()+a;if(!this.index[a]&&console){console.log("Can't find "+a)}var b=this.parameters.basePath+"&start="+this.index[a].start+"&length="+this.index[a].length;if(a.substring(a.length-4)==".jpg"){b=b+"&type=image/jpeg"}else{if(a.substring(a.length-4)==".png"){b=b+"&type=image/png"}else{b=b+"&type=text/plain"}}return b},getImageFilename:function(c,b,d){var a=(-d)+"/"+c+"_"+b+this.suffix;return this.getFilename(a)},getPrefix:function(){if(this.prefix){return this.prefix+"/"}else{return""}},setPrefix:function(a){this.prefix=a}};bigshot.Object.validate("bigshot.ArchiveFileSystem",bigshot.FileSystem);bigshot.VRTileCache=function(){};bigshot.VRTileCache.prototype={getTexture:function(b,a,c){},purge:function(){},dispose:function(){}};bigshot.ImageVRTileCache=function(c,a,b){this.imageTileCache=new bigshot.ImageTileCache(c,a,b);this.imageTileCache.setMaxTiles(999999,999999)};bigshot.ImageVRTileCache.prototype={getTexture:function(c,b,d){var a=this.imageTileCache.getImage(c,b,d);return a},purge:function(){this.imageTileCache.resetUsed()},dispose:function(){}};bigshot.Object.validate("bigshot.ImageVRTileCache",bigshot.VRTileCache);bigshot.TextureTileCache=function(d,a,c,b){this.parameters=c;this.webGl=b;this.fullImage=c.dataLoader.loadImage(c.fileSystem.getPosterFilename(),a);this.maxTextureCacheSize=512;this.maxImageCacheSize=2048;this.cachedTextures={};this.cachedImages={};this.requestedImages={};this.lastOnLoadFiredAt=0;this.imageRequests=0;this.partialImageSize=c.tileSize/8;this.imageLruMap=new bigshot.LRUMap();this.textureLruMap=new bigshot.LRUMap();this.onLoaded=d;this.browser=new bigshot.Browser();this.disposed=false};bigshot.TextureTileCache.prototype={getPartialTexture:function(b,o,e){if(this.fullImage.complete){var c=document.createElement("canvas");if(!c.width){return null}c.width=this.partialImageSize;c.height=this.partialImageSize;var n=c.getContext("2d");var p=this.parameters.posterSize/Math.max(this.parameters.width,this.parameters.height);var l=Math.floor(p*this.parameters.width);var d=Math.floor(p*this.parameters.height);var m=p*(this.parameters.tileSize-this.parameters.overlap)/Math.pow(2,e);var j=Math.floor(m*b);var i=Math.floor(m*o);var k=Math.floor(m);var f=Math.floor(m);var a=this.partialImageSize+2;var g=this.partialImageSize+2;if(j+k>l){k=l-j;a=this.partialImageSize*(k/Math.floor(m))}if(i+f>d){f=d-i;g=this.partialImageSize*(f/Math.floor(m))}n.drawImage(this.fullImage,j,i,k,f,-1,-1,a,g);return this.webGl.createImageTextureFromImage(c,this.parameters.textureMinFilter,this.parameters.textureMagFilter)}else{return null}},setCachedTexture:function(b,a){if(this.cachedTextures[b]!=null){this.webGl.deleteTexture(this.cachedTextures[b])}this.cachedTextures[b]=a},getTexture:function(d,c,e){var b=this.getImageKey(d,c,e);this.textureLruMap.access(b);this.imageLruMap.access(b);if(this.cachedTextures[b]){return this.cachedTextures[b]}else{if(this.cachedImages[b]){this.setCachedTexture(b,this.webGl.createImageTextureFromImage(this.cachedImages[b],this.parameters.textureMinFilter,this.parameters.textureMagFilter));return this.cachedTextures[b]}else{this.requestImage(d,c,e);var a=this.getPartialTexture(d,c,e);if(a){this.setCachedTexture(b,a)}return a}}},requestImage:function(d,c,e){var a=this.getImageKey(d,c,e);if(!this.requestedImages[a]){this.imageRequests++;var b=this;this.parameters.dataLoader.loadImage(this.getImageFilename(d,c,e),function(g){if(b.disposed){return}b.cachedImages[a]=g;b.setCachedTexture(a,b.webGl.createImageTextureFromImage(g,b.parameters.textureMinFilter,b.parameters.textureMagFilter));delete b.requestedImages[a];b.imageRequests--;var f=new Date();if(b.imageRequests==0||f.getTime()>(b.lastOnLoadFiredAt+50)){b.lastOnLoadFiredAt=f.getTime();b.onLoaded()}});this.requestedImages[a]=true}},purge:function(){var a=this;this.purgeCache(this.textureLruMap,this.cachedTextures,this.maxTextureCacheSize,function(b){a.webGl.deleteTexture(a.cachedTextures[b])});this.purgeCache(this.imageLruMap,this.cachedImages,this.maxImageCacheSize,function(b){})},purgeCache:function(b,c,a,e){for(var d=0;d<64;++d){if(b.getSize()>a){var f=b.leastUsed();b.remove(f);if(e){e(f)}delete c[f]}else{break}}},getImageKey:function(b,a,c){return"I"+b+"_"+a+"_"+c},getImageFilename:function(c,a,d){var b=this.parameters.fileSystem.getImageFilename(c,a,d);return b},dispose:function(){this.disposed=true;for(var a in this.cachedTextures){this.webGl.deleteTexture(this.cachedTextures[a])}}};bigshot.Object.validate("bigshot.TextureTileCache",bigshot.VRTileCache);bigshot.VRFace=function(b,j,g,d,m,l,e){var i=this;this.owner=b;this.key=j;this.topLeft=g;this.width=d;this.u=m;this.v=l;this.updated=false;this.parameters=new Object();for(var f in this.owner.getParameters()){this.parameters[f]=this.owner.getParameters()[f]}bigshot.setupFileSystem(this.parameters);this.parameters.fileSystem.setPrefix("face_"+j);this.parameters.merge(this.parameters.fileSystem.getDescriptor(),false);this.tileCache=b.renderer.createTileCache(function(){i.updated=true;b.renderUpdated(bigshot.VRPanorama.ONRENDER_TEXTURE_UPDATE)},e,this.parameters);this.fullSize=this.parameters.width;this.overlap=this.parameters.overlap;this.tileSize=this.parameters.tileSize;this.minDivisions=0;var c=Math.log(this.fullSize-this.overlap)/Math.LN2;var a=Math.log(this.tileSize-this.overlap)/Math.LN2;this.maxDivisions=Math.floor(c-a);this.maxTesselation=this.parameters.maxTesselation>=0?this.parameters.maxTesselation:this.maxDivisions};bigshot.VRFace.prototype={browser:new bigshot.Browser(),dispose:function(){this.tileCache.dispose()},pt3dMultAdd:function(d,b,c){return{x:d.x*b+c.x,y:d.y*b+c.y,z:d.z*b+c.z}},pt3dMult:function(b,a){return{x:b.x*a,y:b.y*a,z:b.z*a}},generateFace:function(g,e,d,b,a,c){d*=this.tileSize/(this.tileSize-this.overlap);var f=this.tileCache.getTexture(b,a,-this.maxDivisions+c);g.addQuad(this.owner.renderer.createTexturedQuad(e,this.pt3dMult(this.u,d),this.pt3dMult(this.v,d),f))},VISIBLE_NONE:0,VISIBLE_SOME:1,VISIBLE_ALL:2,pointInRect:function(b,c,a){return(b.x>=c.x&&b.y>=c.y&&b.x<a.x&&b.y<a.y)},intersectWithView:function intersectWithView(x){var d=0;var c=[];var m=x.length;for(var r=0;r<m;++r){if(x[r]==null){d++}else{c.push(x[r])}}if(d==4){return this.VISIBLE_NONE}var v=c[0].x;var t=c[0].y;var u=v;var s=t;var l=0;var j=0;var k=this.viewportWidth;var g=this.viewportHeight;var a=0;var b=c.length;for(var r=1;r<b;++r){var f=c[r].x;var e=c[r].y;v=v<f?v:f;t=t<e?t:e;u=u>f?u:f;s=s>e?s:e}var q=v>l?v:l;var p=t>j?t:j;var o=u<k?u:k;var n=s<g?s:g;if(q<=o&&p<=n){return this.VISIBLE_SOME}return this.VISIBLE_NONE},screenDistance:function screenDistance(b,a){if(b==null||a==null){return 0}return Math.max(Math.abs(b.x-a.x),Math.abs(b.y-a.y))},transformToScreen:function transformToScreen(a){return this.owner.renderer.transformToScreen(a)},generateSubdivisionFace:function generateSubdivisionFace(p,m,l,b,u,s,y){if(!y){y=new Array(4);y[0]=this.transformToScreen(m);var k=this.pt3dMultAdd(this.u,l,m);y[1]=this.transformToScreen(k);var n=this.pt3dMultAdd(this.v,l,m);y[3]=this.transformToScreen(n);var e=this.pt3dMultAdd(this.v,l,k);y[2]=this.transformToScreen(e)}var x=this.intersectWithView(y);if(x==this.VISIBLE_NONE){return}var j=0;for(var o=0;o<y.length;++o){var g=(o+1)%4;j=Math.max(this.screenDistance(y[o],y[g]),j)}j*=this.owner.browser.getDevicePixelScale();if(b<this.minDivisions||((j>this.owner.maxTextureMagnification*(this.tileSize-this.overlap))&&b<this.maxDivisions&&b<this.maxTesselation)){var t=this.pt3dMultAdd({x:this.u.x+this.v.x,y:this.u.y+this.v.y,z:this.u.z+this.v.z},l/2,m);var r=this.pt3dMultAdd(this.u,l/2,m);var f=this.pt3dMultAdd(this.v,l/2,m);var q=this.transformToScreen(t);var v=this.transformToScreen(f);var d=this.transformToScreen(r);var c=this.transformToScreen(this.pt3dMultAdd(this.u,l,f));var a=this.transformToScreen(this.pt3dMultAdd(this.v,l,r));this.generateSubdivisionFace(p,m,l/2,b+1,u*2,s*2,[y[0],d,q,v]);this.generateSubdivisionFace(p,r,l/2,b+1,u*2+1,s*2,[d,y[1],c,q]);this.generateSubdivisionFace(p,f,l/2,b+1,u*2,s*2+1,[v,q,a,y[3]]);this.generateSubdivisionFace(p,t,l/2,b+1,u*2+1,s*2+1,[q,c,y[2],a])}else{this.generateFace(p,m,l,u,s,b)}},isUpdated:function(){return this.updated},render:function(a){this.updated=false;this.viewportWidth=this.owner.renderer.getViewportWidth();this.viewportHeight=this.owner.renderer.getViewportHeight();this.generateSubdivisionFace(a,this.topLeft,this.width,0,0,0)},endRender:function(){this.tileCache.purge()}};bigshot.WebGLUtil={debug:false,contextNames:["webgl","experimental-webgl"],createContext0:function(a,b){var c=this.debug?WebGLDebugUtils.makeDebugContext(a.getContext(b)):a.getContext(b);return c},createContext:function(a){for(var b=0;b<this.contextNames.length;++b){try{var d=this.createContext0(a,this.contextNames[b]);if(d){return d}}catch(c){}}throw new Error("Could not initialize WebGL.")},isWebGLSupported:function(){var a=document.createElement("canvas");if(!a.width){return false}try{this.createContext(a);return true}catch(b){return false}}};bigshot.TransformStack=function(){this.mvMatrix=null;this.mvMatrixStack=[];this.reset()};bigshot.TransformStack.prototype={push:function(a){if(a){this.mvMatrixStack.push(a.dup());this.mvMatrix=a.dup();return mvMatrix}else{this.mvMatrixStack.push(this.mvMatrix.dup());return mvMatrix}},pop:function(){if(this.mvMatrixStack.length==0){throw new Error("Invalid popMatrix!")}this.mvMatrix=this.mvMatrixStack.pop();return mvMatrix},reset:function(){this.mvMatrix=Matrix.I(4)},multiply:function(a){this.mvMatrix=a.x(this.mvMatrix)},translate:function(b){var a=Matrix.Translation($V([b.x,b.y,b.z])).ensure4x4();this.multiply(a)},rotate:function(c,b){var d=c*Math.PI/180;var a=Matrix.Rotation(d,$V([b.x,b.y,b.z])).ensure4x4();this.multiply(a)},rotateX:function(a){this.rotate(a,{x:1,y:0,z:0})},rotateY:function(a){this.rotate(a,{x:0,y:1,z:0})},rotateZ:function(a){this.rotate(a,{x:0,y:0,z:1})},perspective:function(d,c,b,e){var a=makePerspective(d,c,b,e);this.multiply(a)},matrix:function(){return this.mvMatrix}};bigshot.WebGL=function(a){this.canvas=a;this.gl=bigshot.WebGLUtil.createContext(this.canvas);this.mvMatrix=new bigshot.TransformStack();this.pMatrix=new bigshot.TransformStack();this.shaderProgram=null;this.onresize()};bigshot.WebGL.prototype={onresize:function(){this.gl.viewportWidth=this.canvas.width;this.gl.viewportHeight=this.canvas.height},fragmentShader:"#ifdef GL_ES\n    precision highp float;\n#endif\n\nvarying vec2 vTextureCoord;\n\nuniform sampler2D uSampler;\n\nvoid main(void) {\n    gl_FragColor = texture2D(uSampler, vec2(vTextureCoord.s, vTextureCoord.t));\n}\n",vertexShader:"attribute vec3 aVertexPosition;\nattribute vec2 aTextureCoord;\n\nuniform mat4 uMVMatrix;\nuniform mat4 uPMatrix;\n\nvarying vec2 vTextureCoord;\n\nvoid main(void) {\n    gl_Position = uPMatrix * uMVMatrix * vec4(aVertexPosition, 1.0);\n    vTextureCoord = aTextureCoord;\n}",createShader:function(c,a){var b=this.gl.createShader(a);this.gl.shaderSource(b,c);this.gl.compileShader(b);if(!this.gl.getShaderParameter(b,this.gl.COMPILE_STATUS)){alert(this.gl.getShaderInfoLog(b));return null}return b},createFragmentShader:function(a){return this.createShader(a,this.gl.FRAGMENT_SHADER)},createVertexShader:function(a){return this.createShader(a,this.gl.VERTEX_SHADER)},initShaders:function(){this.shaderProgram=this.gl.createProgram();this.gl.attachShader(this.shaderProgram,this.createVertexShader(this.vertexShader));this.gl.attachShader(this.shaderProgram,this.createFragmentShader(this.fragmentShader));this.gl.linkProgram(this.shaderProgram);if(!this.gl.getProgramParameter(this.shaderProgram,this.gl.LINK_STATUS)){throw new Error("Could not initialise shaders");return}this.gl.useProgram(this.shaderProgram);this.shaderProgram.vertexPositionAttribute=this.gl.getAttribLocation(this.shaderProgram,"aVertexPosition");this.gl.enableVertexAttribArray(this.shaderProgram.vertexPositionAttribute);this.shaderProgram.textureCoordAttribute=this.gl.getAttribLocation(this.shaderProgram,"aTextureCoord");this.gl.enableVertexAttribArray(this.shaderProgram.textureCoordAttribute);this.shaderProgram.pMatrixUniform=this.gl.getUniformLocation(this.shaderProgram,"uPMatrix");this.shaderProgram.mvMatrixUniform=this.gl.getUniformLocation(this.shaderProgram,"uMVMatrix");this.shaderProgram.samplerUniform=this.gl.getUniformLocation(this.shaderProgram,"uSampler")},setMatrixUniforms:function(){this.gl.uniformMatrix4fv(this.shaderProgram.pMatrixUniform,false,new Float32Array(this.pMatrix.matrix().flatten()));this.gl.uniformMatrix4fv(this.shaderProgram.mvMatrixUniform,false,new Float32Array(this.mvMatrix.matrix().flatten()))},createImageTextureFromImage:function(d,a,c){var b=this.gl.createTexture();this.handleImageTextureLoaded(this,b,d,a,c);return b},createImageTextureFromSource:function(e,a,d){var f=new Image();var c=this.gl.createTexture();var b=this;f.onload=function(){b.handleImageTextureLoaded(b,c,f,a,d)};f.src=e;return c},handleImageTextureLoaded:function(c,b,e,a,d){c.gl.bindTexture(c.gl.TEXTURE_2D,b);c.gl.texImage2D(c.gl.TEXTURE_2D,0,c.gl.RGBA,c.gl.RGBA,c.gl.UNSIGNED_BYTE,e);c.gl.texParameteri(c.gl.TEXTURE_2D,c.gl.TEXTURE_MAG_FILTER,d?d:c.gl.NEAREST);c.gl.texParameteri(c.gl.TEXTURE_2D,c.gl.TEXTURE_MIN_FILTER,a?a:c.gl.NEAREST);c.gl.texParameteri(c.gl.TEXTURE_2D,c.gl.TEXTURE_WRAP_S,c.gl.CLAMP_TO_EDGE);c.gl.texParameteri(c.gl.TEXTURE_2D,c.gl.TEXTURE_WRAP_T,c.gl.CLAMP_TO_EDGE);if(a==c.gl.NEAREST_MIPMAP_NEAREST||a==c.gl.LINEAR_MIPMAP_NEAREST||a==c.gl.NEAREST_MIPMAP_LINEAR||a==c.gl.LINEAR_MIPMAP_LINEAR){c.gl.generateMipmap(c.gl.TEXTURE_2D)}c.gl.bindTexture(c.gl.TEXTURE_2D,null)},deleteTexture:function(a){this.gl.deleteTexture(a)},dispose:function(){delete this.canvas;delete this.gl}};bigshot.VRRenderer=function(){};bigshot.VRRenderer.prototype={createTileCache:function(c,a,b){},createTexturedQuadScene:function(){},createTexturedQuad:function(d,b,a,c){},getViewportWidth:function(){},getViewportHeight:function(){},transformToWorld:function(a){},transformWorldToScreen:function(a){},transformToScreen:function(a){},dispose:function(){},beginRender:function(b,a,d,c){},endRender:function(){},onresize:function(){},resize:function(a,b){},getElement:function(){}};bigshot.AbstractVRRenderer=function(){};bigshot.AbstractVRRenderer.prototype={transformToWorld:function transformToWorld(a){var b=this.mvMatrix.matrix().xPoint3Dhom1(a);return b},transformWorldToScreen:function transformWorldToScreen(d){if(d.z>0){return null}var a=this.pMatrix.matrix().xPoint3Dhom(d);if(Math.abs(a.w)<Sylvester.precision){return null}var i=a.x;var f=a.y;var e=a.z;var c=this.getViewportWidth();var g=this.getViewportHeight();var b={x:(c/2)*i/e+c/2,y:-(g/2)*f/e+g/2};return b},transformToScreen:function transformToScreen(a){var d=this.mvpMatrix.xPoint3Dhom(a);if(d.z<0){return null}var e=d.w;if(Math.abs(d.w)<Sylvester.precision){return null}var i=d.x;var f=d.y;var c=this.getViewportWidth();var g=this.getViewportHeight();var b={x:(c/2)*i/e+c/2,y:-(g/2)*f/e+g/2};return b}};bigshot.CSS3DVRRenderer=function(a){this.container=a;this.canvasOrigin=document.createElement("div");this.canvasOrigin.style.WebkitTransformOrigin="0px 0px 0px";this.canvasOrigin.style.WebkitTransformStyle="preserve-3d";this.canvasOrigin.style.WebkitPerspective="600px";this.canvasOrigin.style.position="relative";this.canvasOrigin.style.left="50%";this.canvasOrigin.style.top="50%";this.container.appendChild(this.canvasOrigin);this.viewport=document.createElement("div");this.viewport.style.WebkitTransformOrigin="0px 0px 0px";this.viewport.style.WebkitTransformStyle="preserve-3d";this.canvasOrigin.appendChild(this.viewport);this.world=document.createElement("div");this.world.style.WebkitTransformOrigin="0px 0px 0px";this.world.style.WebkitTransformStyle="preserve-3d";this.viewport.appendChild(this.world);this.browser.removeAllChildren(this.world);this.view=null;this.mvMatrix=new bigshot.TransformStack();this.yaw=0;this.pitch=0;this.fov=0;this.pMatrix=new bigshot.TransformStack();this.onresize=function(){};this.viewportSize=null};bigshot.CSS3DVRRenderer.prototype={browser:new bigshot.Browser(),dispose:function(){},createTileCache:function(c,a,b){return new bigshot.ImageVRTileCache(c,a,b)},createTexturedQuadScene:function(){return new bigshot.CSS3DTexturedQuadScene(this.world,128,this.view)},createTexturedQuad:function(d,b,a,c){return new bigshot.CSS3DTexturedQuad(d,b,a,c)},getElement:function(){return this.container},supportsUpdate:function(){return false},getViewportWidth:function(){if(this.viewportSize){return this.viewportSize.w}return this.browser.getElementSize(this.container).w},getViewportHeight:function(){if(this.viewportSize){return this.viewportSize.h}return this.browser.getElementSize(this.container).h},onresize:function(){},resize:function(a,b){if(this.container.style.width!=""){this.container.style.width=a+"px"}if(this.container.style.height!=""){this.container.style.height=b+"px"}},beginRender:function(e,c,j,g){this.viewportSize=this.browser.getElementSize(this.container);this.yaw=e.y;this.pitch=e.p;this.fov=c;var b=0.5*c*Math.PI/180;var a=this.getViewportHeight()/2;var f=a/Math.tan(b);this.mvMatrix.reset();this.view=j;this.mvMatrix.translate(this.view);this.mvMatrix.rotateZ(g.r);this.mvMatrix.rotateX(g.p);this.mvMatrix.rotateY(g.y);this.mvMatrix.rotateY(this.yaw);this.mvMatrix.rotateX(this.pitch);this.pMatrix.reset();this.pMatrix.perspective(this.fov,this.getViewportWidth()/this.getViewportHeight(),0.1,100);this.mvpMatrix=this.pMatrix.matrix().multiply(this.mvMatrix.matrix());this.canvasOrigin.style.WebkitPerspective=f+"px";for(var d=this.world.children.length-1;d>=0;--d){this.world.children[d].inWorld=1}this.world.style.WebkitTransform="rotate3d(1,0,0,"+(-e.p)+"deg) rotate3d(0,1,0,"+e.y+"deg) rotate3d(0,1,0,"+(g.y)+"deg) rotate3d(1,0,0,"+(-g.p)+"deg) rotate3d(0,0,1,"+(-g.r)+"deg) ";this.world.style.WebkitTransformStyle="preserve-3d";this.world.style.WebKitBackfaceVisibility="hidden";this.viewport.style.WebkitTransform="translateZ("+f+"px)"},endRender:function(){for(var a=this.world.children.length-1;a>=0;--a){var b=this.world.children[a];if(!b.inWorld||b.inWorld!=2){delete b.inWorld;this.world.removeChild(b)}}this.viewportSize=null}};bigshot.Object.extend(bigshot.CSS3DVRRenderer,bigshot.AbstractVRRenderer);bigshot.Object.validate("bigshot.CSS3DVRRenderer",bigshot.VRRenderer);bigshot.CSS3DTexturedQuad=function(d,b,a,c){this.p=d;this.u=b;this.v=a;this.image=c};bigshot.CSS3DTexturedQuad.prototype={crossProduct:function crossProduct(d,c){return{x:d.y*c.z-d.z*c.y,y:d.z*c.x-d.x*c.z,z:d.x*c.y-d.y*c.x}},vecToStr:function vecToStr(a){return(a.x)+","+(a.y)+","+(a.z)},quadTransform:function quadTransform(c,d,b){var a=this.crossProduct(d,b);var e="matrix3d("+this.vecToStr(d)+",0,"+this.vecToStr(b)+",0,"+this.vecToStr(a)+",0,"+this.vecToStr(c)+",1)";return e},norm:function norm(a){return Math.sqrt(a.x*a.x+a.y*a.y+a.z*a.z)},render:function render(e,i,a){var d=i/(this.image.width-1);var g=i*1;var f=this.p;var c=this.u;var b=this.v;this.image.style.position="absolute";if(!this.image.inWorld||this.image.inWorld!=1){e.appendChild(this.image)}this.image.inWorld=2;this.image.style.WebkitTransformOrigin="0px 0px 0px";this.image.style.WebkitTransform=this.quadTransform({x:(f.x+a.x)*g,y:(-f.y+a.y)*g,z:(f.z+a.z)*g},{x:c.x*d,y:-c.y*d,z:c.z*d},{x:b.x*d,y:-b.y*d,z:b.z*d})}};bigshot.CSS3DTexturedQuadScene=function(b,c,a){this.quads=new Array();this.world=b;this.scale=c;this.view=a};bigshot.CSS3DTexturedQuadScene.prototype={addQuad:function(a){this.quads.push(a)},render:function(){for(var a=0;a<this.quads.length;++a){this.quads[a].render(this.world,this.scale,this.view)}}};bigshot.TexturedQuadScene=function(){};bigshot.TexturedQuadScene.prototype={addQuad:function(a){},render:function(){}};bigshot.WebGLVRRenderer=function(a){this.container=a;this.canvas=document.createElement("canvas");this.canvas.width=480;this.canvas.height=480;this.canvas.style.position="absolute";this.container.appendChild(this.canvas);this.webGl=new bigshot.WebGL(this.canvas);this.webGl.initShaders();this.webGl.gl.clearColor(0,0,0,1);this.webGl.gl.blendFunc(this.webGl.gl.ONE,this.webGl.gl.ZERO);this.webGl.gl.enable(this.webGl.gl.BLEND);this.webGl.gl.disable(this.webGl.gl.DEPTH_TEST);this.webGl.gl.clearDepth(1);var b=this;this.buffers=new bigshot.TimedWeakReference(function(){return b.setupBuffers()},function(c){b.disposeBuffers(c)},1000)};bigshot.WebGLVRRenderer.prototype={createTileCache:function(c,a,b){return new bigshot.TextureTileCache(c,a,b,this.webGl)},createTexturedQuadScene:function(){return new bigshot.WebGLTexturedQuadScene(this.webGl,this.buffers)},setupBuffers:function(){var c=this.webGl.gl.createBuffer();var a=this.webGl.gl.createBuffer();this.webGl.gl.bindBuffer(this.webGl.gl.ARRAY_BUFFER,a);var d=[0,0,1,0,1,1,0,1];this.webGl.gl.bufferData(this.webGl.gl.ARRAY_BUFFER,new Float32Array(d),this.webGl.gl.STATIC_DRAW);var b=this.webGl.gl.createBuffer();this.webGl.gl.bindBuffer(this.webGl.gl.ELEMENT_ARRAY_BUFFER,b);var e=[0,2,1,0,3,2];this.webGl.gl.bufferData(this.webGl.gl.ELEMENT_ARRAY_BUFFER,new Uint16Array(e),this.webGl.gl.STATIC_DRAW);this.webGl.gl.bindBuffer(this.webGl.gl.ARRAY_BUFFER,a);this.webGl.gl.vertexAttribPointer(this.webGl.shaderProgram.textureCoordAttribute,2,this.webGl.gl.FLOAT,false,0,0);this.webGl.gl.bindBuffer(this.webGl.gl.ARRAY_BUFFER,c);this.webGl.gl.vertexAttribPointer(this.webGl.shaderProgram.vertexPositionAttribute,3,this.webGl.gl.FLOAT,false,0,0);return{vertexPositionBuffer:c,textureCoordBuffer:a,vertexIndexBuffer:b}},dispose:function(){this.buffers.dispose();this.container.removeChild(this.canvas);delete this.canvas;this.webGl.dispose();delete this.webGl},disposeBuffers:function(a){this.webGl.gl.deleteBuffer(a.vertexPositionBuffer);this.webGl.gl.deleteBuffer(a.vertexIndexBuffer);this.webGl.gl.deleteBuffer(a.textureCoordBuffer)},getElement:function(){return this.canvas},supportsUpdate:function(){return false},createTexturedQuad:function(d,b,a,c){return new bigshot.WebGLTexturedQuad(d,b,a,c)},getViewportWidth:function(){return this.webGl.gl.viewportWidth},getViewportHeight:function(){return this.webGl.gl.viewportHeight},beginRender:function(b,a,d,c){this.webGl.gl.viewport(0,0,this.webGl.gl.viewportWidth,this.webGl.gl.viewportHeight);this.webGl.pMatrix.reset();this.webGl.pMatrix.perspective(a,this.webGl.gl.viewportWidth/this.webGl.gl.viewportHeight,0.1,100);this.webGl.mvMatrix.reset();this.webGl.mvMatrix.translate(d);this.webGl.mvMatrix.rotateZ(c.r);this.webGl.mvMatrix.rotateX(c.p);this.webGl.mvMatrix.rotateY(c.y);this.webGl.mvMatrix.rotateY(b.y);this.webGl.mvMatrix.rotateX(b.p);this.mvMatrix=this.webGl.mvMatrix;this.pMatrix=this.webGl.pMatrix;this.mvpMatrix=this.pMatrix.matrix().multiply(this.mvMatrix.matrix())},endRender:function(){},resize:function(a,b){this.canvas.width=a;this.canvas.height=b;if(this.container.style.width!=""){this.container.style.width=a+"px"}if(this.container.style.height!=""){this.container.style.height=b+"px"}},onresize:function(){this.webGl.onresize()}};bigshot.Object.extend(bigshot.WebGLVRRenderer,bigshot.AbstractVRRenderer);bigshot.Object.validate("bigshot.WebGLVRRenderer",bigshot.VRRenderer);bigshot.TexturedQuad=function(){};bigshot.WebGLTexturedQuad=function(d,b,a,c){this.p=d;this.u=b;this.v=a;this.texture=c};bigshot.WebGLTexturedQuad.prototype={render:function(e,d,a,c){e.gl.bindBuffer(e.gl.ARRAY_BUFFER,d);var b=[this.p.x,this.p.y,this.p.z,this.p.x+this.u.x,this.p.y+this.u.y,this.p.z+this.u.z,this.p.x+this.u.x+this.v.x,this.p.y+this.u.y+this.v.y,this.p.z+this.u.z+this.v.z,this.p.x+this.v.x,this.p.y+this.v.y,this.p.z+this.v.z];e.gl.bufferData(e.gl.ARRAY_BUFFER,new Float32Array(b),e.gl.STATIC_DRAW);e.gl.activeTexture(e.gl.TEXTURE0);e.gl.bindTexture(e.gl.TEXTURE_2D,this.texture);e.gl.uniform1i(e.shaderProgram.samplerUniform,0);e.gl.bindBuffer(e.gl.ELEMENT_ARRAY_BUFFER,c);e.gl.drawElements(e.gl.TRIANGLES,6,e.gl.UNSIGNED_SHORT,0);e.gl.bindTexture(e.gl.TEXTURE_2D,null)}};bigshot.WebGLTexturedQuadScene=function(b,a){this.quads=new Array();this.webGl=b;this.buffers=a};bigshot.WebGLTexturedQuadScene.prototype={addQuad:function(a){this.quads.push(a)},render:function(){var a=this.buffers.get();var f=a.vertexPositionBuffer;var c=a.textureCoordBuffer;var e=a.vertexIndexBuffer;this.webGl.setMatrixUniforms();for(var d=0;d<this.quads.length;++d){this.quads[d].render(this.webGl,f,c,e)}}};bigshot.VRPanoramaParameters=function(b){this.posterSize=0;this.emptyImage=null;this.suffix=null;this.width=0;this.height=0;this.container=null;this.maxTesselation=-1;this.tileSize=0;this.overlap=0;this.basePath=null;this.fileSystemType="folder";this.fileSystem=null;this.dataLoader=new bigshot.DefaultDataLoader();this.maxTextureMagnification=1;this.textureMagFilter=null;this.textureMinFilter=null;this.minFov=2;this.maxFov=90;this.minPitch=-90;this.maxPitch=90;this.minYaw=-360;this.maxYaw=720;this.yawOffset=0;this.pitchOffset=0;this.rollOffset=0;this.onload=null;this.renderer=null;this.fling=true;this.flingScale=0.004;if(b){for(var a in b){this[a]=b[a]}}this.merge=function(d,e){for(var c in d){if(e||!this[c]){this[c]=d[c]}}};return this};bigshot.VRPanorama=function(d){bigshot.EventDispatcher.call(this);var c=this;this.parameters=d;this.maxTextureMagnification=d.maxTextureMagnification;this.container=d.container;this.browser=new bigshot.Browser();this.dragStart=null;this.dragDistance=0;this.hotspots=[];this.disposed=false;this.transformOffsets={y:d.yawOffset,p:d.pitchOffset,r:d.rollOffset};this.state={rotation:{p:0,y:0,r:0},fov:45,translation:{x:0,y:0,z:0}};this.renderer=null;if(this.parameters.renderer){if(this.parameters.renderer=="css"){this.renderer=new bigshot.CSS3DVRRenderer(this.container)}else{if(this.parameters.renderer=="webgl"){this.renderer=new bigshot.WebGLVRRenderer(this.container)}else{throw new Error("Unknown renderer: "+this.parameters.renderer)}}}else{this.renderer=bigshot.WebGLUtil.isWebGLSupported()?new bigshot.WebGLVRRenderer(this.container):new bigshot.CSS3DVRRenderer(this.container)}this.renderListeners=new Array();this.renderables=new Array();this.idleCounter=0;this.maxIdleCounter=-1;this.smoothrotatePermit=0;var f=function(g){if(g.preventDefault){g.preventDefault()}return false};this.fullScreenHandler=null;this.renderAsapPermitTaken=false;this.sizeContainer=null;var a={facesLeft:6,faceLoaded:function(){this.facesLeft--;if(this.facesLeft==0){if(c.parameters.onload){c.parameters.onload()}}}};var b=function(){a.faceLoaded()};this.vrFaces=new Array();this.vrFaces[0]=new bigshot.VRFace(this,"f",{x:-1,y:1,z:-1},2,{x:1,y:0,z:0},{x:0,y:-1,z:0},b);this.vrFaces[1]=new bigshot.VRFace(this,"b",{x:1,y:1,z:1},2,{x:-1,y:0,z:0},{x:0,y:-1,z:0},b);this.vrFaces[2]=new bigshot.VRFace(this,"l",{x:-1,y:1,z:1},2,{x:0,y:0,z:-1},{x:0,y:-1,z:0},b);this.vrFaces[3]=new bigshot.VRFace(this,"r",{x:1,y:1,z:-1},2,{x:0,y:0,z:1},{x:0,y:-1,z:0},b);this.vrFaces[4]=new bigshot.VRFace(this,"u",{x:-1,y:1,z:1},2,{x:1,y:0,z:0},{x:0,y:0,z:-1},b);this.vrFaces[5]=new bigshot.VRFace(this,"d",{x:-1,y:-1,z:-1},2,{x:1,y:0,z:0},{x:0,y:0,z:1},b);var e=function(g){if(g.clientX){return g}else{return{clientX:g.changedTouches[0].clientX,clientY:g.changedTouches[0].clientY}}};this.lastTouchStartAt=-1;this.allListeners={mousedown:function(g){c.smoothRotate();c.resetIdle();c.dragMouseDown(g);return f(g)},mouseup:function(g){c.resetIdle();c.dragMouseUp(g);return f(g)},mousemove:function(g){c.resetIdle();c.dragMouseMove(g);return f(g)},gesturestart:function(g){c.gestureStart(g);return f(g)},gesturechange:function(g){c.gestureChange(g);return f(g)},gestureend:function(g){c.gestureEnd(g);return f(g)},DOMMouseScroll:function(g){c.resetIdle();c.mouseWheel(g);return f(g)},mousewheel:function(g){c.resetIdle();c.mouseWheel(g);return f(g)},dblclick:function(g){c.mouseDoubleClick(g);return f(g)},touchstart:function(g){c.smoothRotate();c.lastTouchStartAt=new Date().getTime();c.resetIdle();c.dragMouseDown(e(g));return f(g)},touchend:function(i){c.resetIdle();var g=c.dragMouseUp(e(i));if(!g&&(c.lastTouchStartAt>new Date().getTime()-350)){c.mouseDoubleClick(e(i))}c.lastTouchStartAt=-1;return f(i)},touchmove:function(g){if(c.dragDistance>24){c.lastTouchStartAt=-1}c.resetIdle();c.dragMouseMove(e(g));return f(g)}};this.addEventListeners();this.onresizeHandler=function(g){c.onresize()};this.browser.registerListener(window,"resize",this.onresizeHandler,false);this.browser.registerListener(document.body,"orientationchange",this.onresizeHandler,false);this.setPitch(0);this.setYaw(0);this.setFov(45)};bigshot.VRPanorama.DRAG_GRAB="grab";bigshot.VRPanorama.DRAG_PAN="pan";bigshot.VRPanorama.ONRENDER_BEGIN=0;bigshot.VRPanorama.ONRENDER_END=1;bigshot.VRPanorama.ONRENDER_TEXTURE_UPDATE=0;bigshot.VRPanorama.prototype={addHotspot:function(a){this.hotspots.push(a)},getParameters:function(){return this.parameters},setTranslation:function(a,c,b){this.state.translation.x=a;this.state.translation.y=c;this.state.translation.z=b},getTranslation:function(){return this.state.translation},setFov:function(a){a=Math.min(this.parameters.maxFov,a);a=Math.max(this.parameters.minFov,a);this.state.fov=a},getFov:function(){return this.state.fov},screenToPolar:function(g,e){var c=this.screenToRayDelta(g,e);var f=$V([c.x,c.y,c.z,1]);f=Matrix.RotationX(this.getPitch()*Math.PI/180).ensure4x4().x(f);f=Matrix.RotationY(-this.getYaw()*Math.PI/180).ensure4x4().x(f);var l=f.e(1);var k=f.e(2);var j=f.e(3);var d=Math.sqrt(l*l+j*j);var a=Math.atan2(l,-j)*180/Math.PI;var i=Math.atan2(k,d)*180/Math.PI;var b={};b.yaw=(a+360)%360;b.pitch=i;return b},snapPitch:function(a){a=Math.min(this.parameters.maxPitch,a);a=Math.max(this.parameters.minPitch,a);return a},setPitch:function(a){this.state.rotation.p=this.snapPitch(a)},circleDistance:function(d,c){if(c>d){var b=(c-d);var a=((c-360)-d);return Math.abs(b)<Math.abs(a)?b:a}else{var b=(c-d);var a=(360-d)+c;return Math.abs(b)<Math.abs(a)?b:a}},circleSnapTo:function(d,e,c){var b=this.circleDistance(d,e);var a=this.circleDistance(d,c);return Math.abs(b)<Math.abs(a)?e:c},snapYaw:function(a){a%=360;if(a<0){a+=360}if(this.parameters.minYaw<this.parameters.maxYaw){if(a>this.parameters.maxYaw||a<this.parameters.minYaw){a=circleSnapTo(a,this.parameters.minYaw,this.parameters.maxYaw)}}else{if(a>this.parameters.minYaw){}else{if(a>this.parameters.maxYaw){a=circleSnapTo(a,this.parameters.minYaw,this.parameters.maxYaw)}else{}}}return a},setYaw:function(a){this.state.rotation.y=this.snapYaw(a)},getYaw:function(){return this.state.rotation.y},getPitch:function(){return this.state.rotation.p},dispose:function(){this.disposed=true;this.browser.unregisterListener(window,"resize",this.onresizeHandler,false);this.browser.unregisterListener(document.body,"orientationchange",this.onresizeHandler,false);this.removeEventListeners();for(var a=0;a<this.vrFaces.length;++a){this.vrFaces[a].dispose()}this.renderer.dispose()},createVREventData:function(b){var a=this.browser.getElementPosition(this.container);b.localX=b.clientX-a.x;b.localY=b.clientY-a.y;b.ray=this.screenToRay(b.localX,b.localY);var c=this.screenToPolar(b.localX,b.localY);b.yaw=c.yaw;b.pitch=c.pitch;b.target=this;b.currentTarget=this;return new bigshot.VREvent(b)},beginRender:function(b,a){this.onrender(bigshot.VRPanorama.ONRENDER_BEGIN,b,a);this.renderer.beginRender(this.state.rotation,this.state.fov,this.state.translation,this.transformOffsets)},addRenderListener:function(a){var b=new Array();b=b.concat(this.renderListeners);b.push(a);this.renderListeners=b},removeRenderListener:function(b){var c=new Array();c=c.concat(this.renderListeners);for(var a=0;a<c.length;++a){if(c[a]===b){c.splice(a,1);break}}this.renderListeners=c},onrender:function(d,c,b){var e=this.renderListeners;for(var a=0;a<e.length;++a){e[a](d,c,b)}},endRender:function(c,b){for(var a in this.vrFaces){this.vrFaces[a].endRender()}this.renderer.endRender();this.onrender(bigshot.VRPanorama.ONRENDER_END,c,b)},addRenderable:function(a){var b=new Array();b.concat(this.renderables);b.push(a);this.renderables=b},removeRenderable:function(b){var c=new Array();c.concat(this.renderables);for(var a=0;a<c.length;++a){if(c[a]==listener){c.splice(a,1);break}}this.renderables=c},render:function(d,c){if(!this.disposed){this.beginRender(d,c);var e=this.renderer.createTexturedQuadScene();for(var b in this.vrFaces){this.vrFaces[b].render(e)}for(var a=0;a<this.renderables.length;++a){this.renderables[a](this.renderer,e)}e.render();for(var a=0;a<this.hotspots.length;++a){this.hotspots[a].layout()}this.endRender(d,c)}},renderUpdated:function(d,c){if(!this.disposed&&this.renderer.supportsUpdate()){this.beginRender(d,c);var e=this.renderer.createTexturedQuadScene();for(var b in this.vrFaces){if(this.vrFaces[b].isUpdated()){this.vrFaces[b].render(e)}}e.render();for(var a=0;a<this.hotspots.length;++a){this.hotspots[a].layout()}this.endRender(d,c)}else{this.render(d,c)}},dragMode:bigshot.VRPanorama.DRAG_GRAB,setDragMode:function(a){this.dragMode=a},addEventListeners:function(){for(var a in this.allListeners){this.browser.registerListener(this.container,a,this.allListeners[a],false)}},removeEventListeners:function(){for(var a in this.allListeners){this.browser.unregisterListener(this.container,a,this.allListeners[a],false)}},dragMouseDown:function(a){this.dragStart={clientX:a.clientX,clientY:a.clientY};this.dragLast={clientX:a.clientX,clientY:a.clientY,dx:0,dy:0,dt:1000000,time:new Date().getTime()};this.dragDistance=0},dragMouseUp:function(i){if(this.dragStart==null||this.dragLast==null){this.dragStart=null;this.dragLast=null;return}this.dragStart=null;var l=this.dragLast.dx;var k=this.dragLast.dy;var d=Math.sqrt(l*l+k*k);var c=this.dragLast.dt;var b=new Date().getTime()-this.dragLast.time;this.dragLast=null;var j=c>0?(d/c):0;if(j>0.05&&b<250&&c>20&&this.parameters.fling){var f=this.state.fov/this.renderer.getViewportHeight();var g=new Date().getTime();var a=this.parameters.flingScale;l/=c;k/=c;this.smoothRotate(function(n){var m=new Date().getTime()-g;var e=Math.pow(2,-m*a);var o=(l*n*f)*e;return e>0.01?o:null},function(n){var m=new Date().getTime()-g;var e=Math.pow(2,-m*a);var o=(k*n*f)*e;return e>0.01?o:null},function(){return null});return true}else{this.smoothRotate();return false}},dragMouseMove:function(d){if(this.dragStart!=null&&this.currentGesture==null){if(this.dragMode==bigshot.VRPanorama.DRAG_GRAB){this.smoothRotate();var f=this.state.fov/this.renderer.getViewportHeight();var b=d.clientX-this.dragStart.clientX;var a=d.clientY-this.dragStart.clientY;this.dragDistance+=b+a;this.setYaw(this.getYaw()-b*f);this.setPitch(this.getPitch()-a*f);this.renderAsap();this.dragStart=d;var c=new Date().getTime()-this.dragLast.time;if(c>20){this.dragLast={dx:this.dragLast.clientX-d.clientX,dy:this.dragLast.clientY-d.clientY,dt:c,clientX:d.clientX,clientY:d.clientY,time:new Date().getTime()}}}else{var f=0.1*this.state.fov/this.renderer.getViewportHeight();var b=d.clientX-this.dragStart.clientX;var a=d.clientY-this.dragStart.clientY;this.dragDistance=b+a;this.smoothRotate(function(){return b*f},function(){return a*f})}}},onMouseDoubleClick:function(c,a,d){var b=this.createVREventData({type:"dblclick",clientX:c.clientX,clientY:c.clientY});this.fireEvent("dblclick",b);if(!b.defaultPrevented){this.smoothRotateToXY(a,d)}},mouseDoubleClick:function(a){var b=this.browser.getElementPosition(this.container);this.onMouseDoubleClick(a,a.clientX-b.x,a.clientY-b.y)},gestureStart:function(a){this.currentGesture={startFov:this.getFov(),scale:a.scale}},gestureEnd:function(a){this.currentGesture=null},gestureChange:function(a){if(this.currentGesture){var b=this.currentGesture.startFov/a.scale;this.setFov(b);this.renderAsap()}},setMaxTextureMagnification:function(a){this.maxTextureMagnification=a},getMaxTextureMagnification:function(){return this.maxTextureMagnification},getMinFovFromViewportAndImage:function(){var a=this.renderer.getViewportHeight()/2;var f=this.vrFaces[0].parameters.height;for(var c in this.vrFaces){f=Math.min(f,this.vrFaces[c].parameters.height)}var b=this.maxTextureMagnification*f/2;var d=a/b;var e=Math.atan(d)*180/Math.PI;return e*2},screenToRay:function(a,d){var c=this.screenToRayDelta(a,d);var b=this.renderer.transformToWorld(c);b=Matrix.RotationY(-this.transformOffsets.y*Math.PI/180).ensure4x4().xPoint3Dhom1(b);b=Matrix.RotationX(-this.transformOffsets.p*Math.PI/180).ensure4x4().xPoint3Dhom1(b);b=Matrix.RotationZ(-this.transformOffsets.r*Math.PI/180).ensure4x4().xPoint3Dhom1(b);return b},screenToRayDelta:function(j,i){var g=this.renderer.getViewportHeight()/2;var d=this.renderer.getViewportWidth()/2;var j=(j-d);var i=(i-g);var e=Math.tan((this.state.fov/2)*Math.PI/180);var f=e*this.renderer.getViewportWidth()/this.renderer.getViewportHeight();var c=j*f/d;var b=i*e/g;var a=-1;return{x:c,y:b,z:a}},smoothRotateToXY:function(a,c){var b=this.screenToPolar(a,c);this.smoothRotateTo(this.snapYaw(b.yaw),this.snapPitch(b.pitch),this.getFov(),this.state.fov/200)},ease:function(f,e,c,a){var b=c*40;if(!a){a=c/5}var d=c/1000;var g=f-e;if(g>b){g=-c}else{if(g<-b){g=c}else{if(Math.abs(g)<a){g=-g}else{if(Math.abs(g)<d){g=0}else{g=-(c*g)/(b)}}}}return g},resetIdle:function(){this.idleCounter=0},idleTick:function(){if(this.maxIdleCounter<0){return}++this.idleCounter;if(this.idleCounter==this.maxIdleCounter){this.autoRotate()}var a=this;setTimeout(function(){a.idleTick()},1000)},autoRotateWhenIdle:function(a){this.maxIdleCounter=a;this.idleCounter=0;if(a<0){return}else{if(this.maxIdleCounter>0){var b=this;setTimeout(function(){b.idleTick()},1000)}}},autoRotate:function(){var b=this;var d=this.state.fov/400;var c=d;var a=c;this.smoothRotate(function(){var e=b.getYaw()+a;if(b.parameters.minYaw<b.parameters.maxYaw){if(e>b.parameters.maxYaw||e<b.parameters.minYaw){a=-a}}else{if(e>b.parameters.minYaw){}else{if(e>b.parameters.maxYaw){a=-a}else{}}}return a},function(){return b.ease(b.getPitch(),0,c)},function(){return b.ease(b.getFov(),45,0.1)})},smoothRotateTo:function(e,d,a,c){var b=this;this.smoothRotate(function(){var g=b.circleDistance(e,b.getYaw());var f=-b.ease(0,g,c);return Math.abs(f)>0.01?f:null},function(){var f=b.ease(b.getPitch(),d,c);return Math.abs(f)>0.01?f:null},function(){var f=b.ease(b.getFov(),a,c);return Math.abs(f)>0.01?f:null})},smoothRotate:function(c,g,f){++this.smoothrotatePermit;var d=this.smoothrotatePermit;if(!g&&!c&&!f){return}var e=this;var b={dy:c,dp:g,df:f,t:new Date().getTime()};var a=function(){if(e.smoothrotatePermit==d){var i=new Date().getTime();var k=i-b.t;b.t=i;var j=false;if(b.dy){var l=b.dy(k);if(l!=null){j=true;e.setYaw(e.getYaw()+l)}else{b.dy=null}}if(b.dp){var l=b.dp(k);if(l!=null){j=true;e.setPitch(e.getPitch()+l)}else{b.dp=null}}if(b.df){var l=b.df(k);if(l!=null){j=true;e.setFov(e.getFov()+l)}else{b.df=null}}e.render();if(j){e.browser.requestAnimationFrame(a,e.renderer.getElement())}}};a()},mouseWheel:function(a){var b=0;if(!a){a=window.event}if(a.wheelDelta){b=a.wheelDelta/120;if(window.opera){b=-b}}else{if(a.detail){b=-a.detail}}if(b){this.mouseWheelHandler(b)}if(a.preventDefault){a.preventDefault()}a.returnValue=false},mouseWheelHandler:function(c){var a=this;var b=null;if(c>0){if(this.getFov()>this.parameters.minFov){b=this.getFov()*0.9}}if(c<0){if(this.getFov()<this.parameters.maxFov){b=this.getFov()/0.9}}if(b!=null){this.smoothRotate(null,null,function(){var d=(b-a.getFov())/1.5;return Math.abs(d)>0.01?d:null})}},fullScreen:function(a){if(this.fullScreenHandler){return}var d=document.createElement("div");d.style.position="absolute";d.style.fontSize="16pt";d.style.top="128px";d.style.width="100%";d.style.color="white";d.style.padding="16px";d.style.zIndex="9999";d.style.textAlign="center";d.style.opacity="0.75";d.innerHTML="<span style='border-radius: 16px; -moz-border-radius: 16px; padding: 16px; padding-left: 32px; padding-right: 32px; background:black'>Press Esc to exit full screen mode.</span>";var c=this;this.fullScreenHandler=new bigshot.FullScreen(this.container);this.fullScreenHandler.restoreSize=this.sizeContainer==null;this.fullScreenHandler.addOnResize(function(){c.onresize()});this.fullScreenHandler.addOnClose(function(){if(d.parentNode){try{div.removeChild(d)}catch(e){}}c.fullScreenHandler=null});if(a){this.fullScreenHandler.addOnClose(function(){a()})}this.removeEventListeners();this.fullScreenHandler.open();this.addEventListeners();var b=function(){c.render()};setTimeout(b,1000);setTimeout(b,2000);setTimeout(b,3000);if(this.fullScreenHandler.getRootElement()){this.fullScreenHandler.getRootElement().appendChild(d);setTimeout(function(){var f=0.75;var e=function(){f-=0.02;if(d.parentNode){if(f<=0){d.style.display="none";try{div.removeChild(d)}catch(g){}}else{d.style.opacity=f;setTimeout(e,20)}}};setTimeout(e,20)},3500)}return function(){c.removeEventListeners();c.fullScreenHandler.close();c.addEventListeners()}},onresize:function(){if(this.fullScreenHandler==null||!this.fullScreenHandler.isFullScreen){if(this.sizeContainer){var a=this.browser.getElementSize(this.sizeContainer);this.renderer.resize(a.w,a.h)}}else{this.container.style.width=window.innerWidth+"px";this.container.style.height=window.innerHeight+"px";var a=this.browser.getElementSize(this.container);this.renderer.resize(a.w,a.h)}this.renderer.onresize();this.renderAsap()},renderAsap:function(){if(!this.renderAsapPermitTaken&&!this.disposed){this.renderAsapPermitTaken=true;var a=this;this.browser.requestAnimationFrame(function(){a.renderAsapPermitTaken=false;a.render()},this.renderer.getElement())}},autoResizeContainer:function(a){this.sizeContainer=a}};bigshot.Object.extend(bigshot.VRPanorama,bigshot.EventDispatcher);bigshot.VRHotspot=function(a){this.panorama=a;this.clippingStrategy=bigshot.VRHotspot.CLIP_ADJUST(a)};bigshot.VRHotspot.CLIP_FRACTION=function(b,a){return function(f){var g={x0:Math.max(f.x,0),y0:Math.max(f.y,0),x1:Math.min(f.x+f.w,b.renderer.getViewportWidth()),y1:Math.min(f.y+f.h,b.renderer.getViewportHeight())};var e=f.w*f.h;var d=(g.x1-g.x0);var c=(g.y1-g.y0);if(d>0&&c>0){var i=d*c;return(i/e)>=a}else{return false}}};bigshot.VRHotspot.CLIP_CENTER=function(a){return function(b){var d={x:b.x+b.w/2,y:b.y+b.h/2};return d.x>=0&&d.x<a.renderer.getViewportWidth()&&d.y>=0&&d.y<a.renderer.getViewportHeight()}};bigshot.VRHotspot.CLIP_ADJUST=function(a){return function(b){if(b.x<0){b.w-=-b.x;b.x=0}if(b.y<0){b.h-=-b.y;b.y=0}if(b.x+b.w>a.renderer.getViewportWidth()){b.w=a.renderer.getViewportWidth()-b.x-1}if(b.y+b.h>a.renderer.getViewportHeight()){b.h=a.renderer.getViewportHeight()-b.y-1}return b.w>0&&b.h>0}};bigshot.VRHotspot.CLIP_ZOOM=function(a,c,b){return function(d){if(d.x>=0&&d.y>=0&&(d.x+c.w)<a.renderer.getViewportWidth()&&(d.y+c.h)<a.renderer.getViewportHeight()){d.w=c.w;d.h=c.h;return true}var f=0;if(d.x<0){f=Math.max(-d.x,f)}if(d.y<0){f=Math.max(-d.y,f)}if(d.x+c.w>a.renderer.getViewportWidth()){f=Math.max(d.x+c.w-a.renderer.getViewportWidth(),f)}if(d.y+c.h>a.renderer.getViewportHeight()){f=Math.max(d.y+c.h-a.renderer.getViewportHeight(),f)}f/=a.renderer.getViewportHeight();if(f>b){return false}var e=1/(1+f);d.w=c.w*e;d.h=c.w*e;if(d.x<0){d.x=0}if(d.y<0){d.y=0}if(d.x+d.w>a.renderer.getViewportWidth()){d.x=a.renderer.getViewportWidth()-d.w}if(d.y+d.h>a.renderer.getViewportHeight()){d.y=a.renderer.getViewportHeight()-d.h}return true}};bigshot.VRHotspot.CLIP_FADE=function(a,b){return function(c){var d=Math.min(c.x,c.y,a.renderer.getViewportWidth()-(c.x+c.w),a.renderer.getViewportHeight()-(c.y+c.h));if(d<=0){return false}else{if(d<=b){c.opacity=(d/b);return true}else{c.opacity=1;return true}}}};bigshot.VRHotspot.prototype={layout:function(){},rotate:function(d,c,b){var e=d*Math.PI/180;var a=Matrix.Rotation(e,$V([c.x,c.y,c.z])).ensure4x4();return a.xPoint3Dhom1(b)},toVector:function(c,b){var a={x:0,y:0,z:-1};a=this.rotate(-b,{x:1,y:0,z:0},a);a=this.rotate(-c,{x:0,y:1,z:0},a);return a},toScreen:function(b){var a=this.panorama.renderer.transformToScreen(b);return a},clip:function(a){return this.clippingStrategy(a)}};bigshot.VRPointHotspot=function(c,e,d,b,a,f){bigshot.VRHotspot.call(this,c);this.element=b;this.offsetX=a;this.offsetY=f;this.point=this.toVector(e,d)};bigshot.VRPointHotspot.prototype={layout:function(){var b=this.toScreen(this.point);var c=false;if(b!=null){var a=this.panorama.browser.getElementSize(this.element);b.w=a.w;b.h=a.h;b.x+=this.offsetX;b.y+=this.offsetY;if(this.clip(b)){this.element.style.top=(b.y)+"px";this.element.style.left=(b.x)+"px";this.element.style.width=(b.w)+"px";this.element.style.height=(b.h)+"px";if(b.opacity){this.element.style.opacity=b.opacity}this.element.style.visibility="inherit";c=true}}if(!c){this.element.style.visibility="hidden"}}};bigshot.Object.extend(bigshot.VRPointHotspot,bigshot.VRHotspot);bigshot.Object.validate("bigshot.VRPointHotspot",bigshot.VRHotspot);bigshot.VRRectangleHotspot=function(d,f,b,e,a,c){bigshot.VRHotspot.call(this,d);this.element=c;this.point0=this.toVector(f,b);this.point1=this.toVector(e,a)};bigshot.VRRectangleHotspot.prototype={layout:function(){var a=this.toScreen(this.point0);var d=this.toScreen(this.point1);var c=false;if(a!=null&&d!=null){var b={x:a.x,y:a.y,opacity:1,w:d.x-a.x,h:d.y-a.y};if(this.clip(b)){this.element.style.top=(b.y)+"px";this.element.style.left=(b.x)+"px";this.element.style.width=(b.w)+"px";this.element.style.height=(b.h)+"px";this.element.style.visibility="inherit";c=true}}if(!c){this.element.style.visibility="hidden"}}};bigshot.Object.extend(bigshot.VRRectangleHotspot,bigshot.VRHotspot);bigshot.Object.validate("bigshot.VRRectangleHotspot",bigshot.VRHotspot);bigshot.AdaptiveLODMonitorParameters=function(b){this.vrPanorama=null;this.targetFps=30;this.tolerance=0.3;this.rate=0.1;this.minMag=1.5;this.maxMag=16;this.hqRenderMag=1.5;this.hqRenderDelay=2000;this.hqRenderInterval=1000;if(b){for(var a in b){this[a]=b[a]}}this.merge=function(d,e){for(var c in d){if(e||!this[c]){this[c]=d[c]}}};return this};bigshot.AdaptiveLODMonitor=function(b){this.setParameters(b);this.currentAdaptiveMagnification=b.vrPanorama.getMaxTextureMagnification();this.frames=0;this.samples=0;this.renderTimeTotal=0;this.renderTimeLast=0;this.samplesLast=0;this.startTime=0;this.lastRender=0;this.hqRender=false;this.hqMode=false;this.hqRenderWaiting=false;this.enabled=true;var a=this;this.listenerFunction=function(e,d,c){a.listener(e,d,c)}};bigshot.AdaptiveLODMonitor.prototype={averageRenderTime:function(){if(this.samples>0){return this.renderTimeTotal/this.samples}else{return -1}},setParameters:function(a){this.parameters=a;this.targetTime=1000/this.parameters.targetFps;this.lowerTime=this.targetTime/(1+this.parameters.tolerance);this.upperTime=this.targetTime*(1+this.parameters.tolerance)},setEnabled:function(a){this.enabled=a},averageRenderTimeLast:function(){if(this.samples>0){return this.renderTimeLast/this.samplesLast}else{return -1}},getListener:function(){return this.listenerFunction},increaseDetail:function(){this.currentAdaptiveMagnification=Math.max(this.parameters.minMag,this.currentAdaptiveMagnification/(1+this.parameters.rate))},decreaseDetail:function(){this.currentAdaptiveMagnification=Math.min(this.parameters.maxMag,this.currentAdaptiveMagnification*(1+this.parameters.rate))},sample:function(){var b=new Date().getTime()-this.startTime;this.samples++;this.renderTimeTotal+=b;this.samplesLast++;this.renderTimeLast+=b;if(this.samplesLast>4){var a=this.renderTimeLast/this.samplesLast;if(a<this.lowerTime){this.increaseDetail()}else{if(a>this.upperTime){this.decreaseDetail()}}this.samplesLast=0;this.renderTimeLast=0}},hqRenderTick:function(){if(this.lastRender<new Date().getTime()-this.parameters.hqRenderDelay){this.hqRender=true;this.hqMode=true;if(this.enabled){this.parameters.vrPanorama.setMaxTextureMagnification(this.parameters.hqRenderMag);this.parameters.vrPanorama.render()}this.hqRender=false;this.hqRenderWaiting=false}else{var a=this;setTimeout(function(){a.hqRenderTick()},this.parameters.hqRenderInterval)}},listener:function(d,c,b){if(!this.enabled){return}if(this.hqRender){return}if(this.hqMode&&c==bigshot.VRPanorama.ONRENDER_TEXTURE_UPDATE){this.parameters.vrPanorama.setMaxTextureMagnification(this.parameters.minMag);return}else{this.hqMode=false}this.parameters.vrPanorama.setMaxTextureMagnification(this.currentAdaptiveMagnification);this.frames++;if((this.frames<20||this.frames%5==0)&&d==bigshot.VRPanorama.ONRENDER_BEGIN){this.startTime=new Date().getTime();this.lastRender=this.startTime;var a=this;setTimeout(function(){a.sample()},1);if(!this.hqRenderWaiting){this.hqRenderWaiting=true;setTimeout(function(){a.hqRenderTick()},this.parameters.hqRenderInterval)}}}}};

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
/* global _, Gallery, Thumbnails */
/**
 * OCA.FileList methods needed for file uploading
 *
 * This hack makes it possible to use the Files scripts as is, without having to import and
 * maintain them in Gallery
 *
 * Empty methods are for the "new" button, if we want to implement that one day
 *
 * @type {{findFile: FileList.findFile, createFile: FileList.createFile,
 *     getCurrentDirectory: FileList.getCurrentDirectory, getUploadUrl:
 *     FileList.getUploadUrl}}
 */
var FileList = {
	/**
	 * Makes sure the filename does not exist
	 *
	 * Gives an early chance to the user to abort the action, before uploading everything to the
	 * server.
	 * Albums are not supported as we don't have a full list of images contained in a sub-album
	 *
	 * @param fileName
	 * @returns {*}
	 */
	findFile: function (fileName) {
		"use strict";
		var path = Gallery.currentAlbum + '/' + fileName;
		var galleryImage = Gallery.imageMap[path];
		if (galleryImage) {
			var fileInfo = {
				name: fileName,
				directory: Gallery.currentAlbum,
				path: path,
				etag: galleryImage.etag,
				mtime: galleryImage.mTime * 1000, // Javascript gives the Epoch time in milliseconds
				size: galleryImage.size
			};
			return fileInfo;
		} else {
			return null;
		}
	},

	/**
	 * Create an empty file inside the current album.
	 *
	 * @param {string} name name of the file
	 *
	 * @return {Promise} promise that will be resolved after the
	 * file was created
	 *
	 */
	createFile: function(name) {
		var self = this;
		var deferred = $.Deferred();
		var promise = deferred.promise();

		OCA.Files.isFileNameValid(name);

		var targetPath = this.getCurrentDirectory() + '/' + name;

		//Check if file already exists
		if(Gallery.imageMap[targetPath]) {
			OC.Notification.showTemporary(
				t('files', 'Could not create file "{file}" because it already exists', {file: name})
			);
			deferred.reject();
			return promise;
		}

		Gallery.filesClient.putFileContents(
			targetPath,
			'',
			{
				contentType: 'text/plain',
				overwrite: true
			}
			)
			.done(function() {
				// TODO: error handling / conflicts
				Gallery.filesClient.getFileInfo(
					targetPath, {
						properties: self.findFile(targetPath)
					}
					)
					.then(function(status, data) {
						deferred.resolve(status, data);
					})
					.fail(function(status) {
						OC.Notification.showTemporary(t('files', 'Could not create file "{file}"', {file: name}));
						deferred.reject(status);
					});
			})
			.fail(function(status) {
				if (status === 412) {
					OC.Notification.showTemporary(
						t('files', 'Could not create file "{file}" because it already exists', {file: name})
					);
				} else {
					OC.Notification.showTemporary(t('files', 'Could not create file "{file}"', {file: name}));
				}
				deferred.reject(status);
			});

		return promise;
	},


	/**
	 * Retrieves the current album
	 *
	 * @returns {string}
	 */
	getCurrentDirectory: function () {
		"use strict";

		// In Files, dirs start with a /
		return '/' + Gallery.currentAlbum;
	},

	/**
	 * Retrieves the WebDAV upload URL
	 *
	 * @param {string} fileName
	 * @param {string} dir
	 *
	 * @returns {string}
	 */
	getUploadUrl: function (fileName, dir) {
		if (_.isUndefined(dir)) {
			dir = this.getCurrentDirectory();
		}

		var pathSections = dir.split('/');
		if (!_.isUndefined(fileName)) {
			pathSections.push(fileName);
		}
		var encodedPath = '';
		_.each(pathSections, function (section) {
			if (section !== '') {
				encodedPath += '/' + encodeURIComponent(section);
			}
		});
		return OC.linkToRemoteBase('webdav') + encodedPath;
	}
};

/**
 * OCA.Files methods needed for file uploading
 *
 * This hack makes it possible to use the Files scripts as is, without having to import and
 * maintain them in Gallery
 *
 * @type {{isFileNameValid: Files.isFileNameValid, generatePreviewUrl: Files.generatePreviewUrl}}
 */
var Files = {
	App: {fileList: {}},

	isFileNameValid: function (name) {
		"use strict";
		var trimmedName = name.trim();
		if (trimmedName === '.' || trimmedName === '..') {
			throw t('files', '"{name}" is an invalid file name.', {name: name});
		} else if (trimmedName.length === 0) {
			throw t('files', 'File name cannot be empty.');
		} else if (OC.fileIsBlacklisted(trimmedName)) {
			throw t('files', '"{name}" is not an allowed filetype', {name: name});
		}

		return true;

	},

	/**
	 * Generates a preview for the conflict dialogue
	 *
	 * Since Gallery uses the fileId and Files uses the path, we have to use the preview endpoint
	 * of Files
	 */
	generatePreviewUrl: function (urlSpec) {
		"use strict";
		var previewUrl;
		var path = urlSpec.file;

		// In Files, root files start with //
		if (path.indexOf('//') === 0) {
			path = path.substring(2);
		} else {
			// Directories start with /
			path = path.substring(1);
		}

		if (Gallery.imageMap[path]) {
			var fileId = Gallery.imageMap[path].fileId;
			var thumbnail = Thumbnails.map[fileId];
			previewUrl = thumbnail.image.src;
		} else {
			var previewDimension = 96;
			urlSpec.x = Math.ceil(previewDimension * window.devicePixelRatio);
			urlSpec.y = Math.ceil(previewDimension * window.devicePixelRatio);
			urlSpec.forceIcon = 0;
			previewUrl = OC.generateUrl('/core/preview.png?') + $.param(urlSpec);
		}

		return previewUrl;
	}
};

OCA.Files = Files;
OCA.Files.App.fileList = FileList;


/*
 * Copyright (c) 2014-2016
 *
 * This file is licensed under the Affero General Public License version 3
 * or later.
 *
 * See the COPYING file.
 *
 */

/* global Handlebars, Gallery */
(function ($, Gallery) {
	"use strict";
	var TEMPLATE_MENU =
		'<ul>' +
		'<li>' +
		'<label for="file_upload_start" class="menuitem" data-action="upload" title="{{uploadMaxHumanFilesize}}"><span class="svg icon icon-upload"></span><span class="displayname">{{uploadLabel}}</span></label>' +
		'</li>' +
		'{{#each items}}' +
		'<li>' +
		'<a href="#" class="menuitem" data-action="{{id}}"><span class="icon {{iconClass}} svg"></span><span class="displayname">{{displayName}}</span></a>' +
		'</li>' +
		'{{/each}}' +
		'</ul>';

	/**
	 * Construct a new NewFileMenu instance
	 * @constructs NewFileMenu
	 *
	 * @memberof Gallery
	 */
	var NewFileMenu = OC.Backbone.View.extend({
		tagName: 'div',
		// Menu is opened by default because it's rendered on "add-button" click
		className: 'newFileMenu popovermenu bubble menu open menu-left',

		events: {
			'click .menuitem': '_onClickAction'
		},

		initialize: function () {
			var self = this;
			var $uploadEl = $('#file_upload_start');
			if ($uploadEl.length) {
				$uploadEl.on('fileuploadstart', function () {
					self.trigger('actionPerformed', 'upload');
				});
			} else {
				console.warn('Missing upload element "file_upload_start"');
			}
			this._menuItems = [];
			OC.Plugins.attach('Gallery.NewFileMenu', this);
		},

		template: function (data) {
			if (!Gallery.NewFileMenu._TEMPLATE) {
				Gallery.NewFileMenu._TEMPLATE = Handlebars.compile(TEMPLATE_MENU);
			}
			return Gallery.NewFileMenu._TEMPLATE(data);
		},

		/**
		 * Event handler whenever the upload button has been clicked within the menu
		 */
		_onClickAction: function (event) {
			var $target = $(event.target);
			if (!$target.hasClass('menuitem')) {
				$target = $target.closest('.menuitem');
			}
			var action = $target.attr('data-action');
			// note: clicking the upload label will automatically
			// set the focus on the "file_upload_start" hidden field
			// which itself triggers the upload dialog.
			// Currently the upload logic is still in file-upload.js and filelist.js
			if (action === 'upload') {
				OC.hideMenus(null);
			} else {
				event.preventDefault();
				this.$el.find('.menuitem.active').removeClass('active');
				$target.addClass('active');
				var actionItem;
				for (var i = 0, len = this._menuItems.length; i < len; i++) {
					if (this._menuItems[i].id === action) {
						actionItem = this._menuItems[i];
						break; // Return as soon as the object is found
					}
				}
				if (actionItem !== null) {
					actionItem.actionHandler();
				}
				OC.hideMenus(null);
			}
		},


		/**
		 * Add a new item menu entry in the “New” file menu (in
		 * last position). By clicking on the item, the
		 * `actionHandler` function is called.
		 *
		 * @param {Object} actionSpec item’s properties
		 */
		addMenuEntry: function (actionSpec) {
			this._menuItems.push({
				'id': actionSpec.id,
				'displayName': actionSpec.displayName,
				'iconClass': actionSpec.iconClass,
				'actionHandler': actionSpec.actionHandler,
			});
		},

		/**
		 * Renders the menu with the currently set items
		 */
		render: function () {
			this.$el.html(this.template({
				uploadMaxHumanFileSize: 'TODO',
				uploadLabel: t('gallery', 'Upload'),
				items: this._menuItems
			}));
		},

		/**
		 * Displays the menu under the given element
		 *
		 * @param {Object} $target target element
		 */
		showAt: function ($target) {
			this.render();
			OC.showMenu(null, this.$el);
		}
	});

	Gallery.NewFileMenu = NewFileMenu;
})(jQuery, Gallery);


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
var galleryMenuHideAlbum = {
	attach: function (menu) {
		menu.addMenuEntry({
			'id': 'hideAlbum',
			'displayName': t('gallery', 'Hide Album'),
			'iconClass': 'icon-close',
			'actionHandler': function () {
				FileList.createFile('.nomedia')
					.then(function() {
						window.location.reload();
					})
					.fail(function() {
						OC.Notification.showTemporary(t('gallery', 'Could not hide album'));
					});
			}
		});
	}
};
OC.Plugins.register('Gallery.NewFileMenu', galleryMenuHideAlbum);


