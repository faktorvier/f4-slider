/*! FAKTOR VIER Slider v1.0.11 | (c) 2021 FAKTOR VIER GmbH | http://faktorvier.ch */

(function($) {

	// Global object
	$.f4slider = {
		global: {
			attrKeysEnabled: 'data-slider-keys-enabled',
			allKeys: [],
			videoPluginAvailable: false
		},
		config: {
			attrInit: 'data-slider-init',

			attrSlider: 'data-slider',
			attrSliderHidden: 'data-slider-hidden',
			attrSlide: 'data-slide',
			attrSlideCurrent: 'data-slide-current',
			attrSlideElement: 'data-slide-element',

			attrSlideIn: 'data-slide-in',
			attrSlideOut: 'data-slide-out',
			attrSlidePrev: 'data-slide-prev',
			attrSlideNext: 'data-slide-next',

			attrTriggerRef: 'data-slider-ref',
			attrTrigger: 'data-slide-trigger',
			attrTriggerCurrent: 'data-slide-trigger-current',
			valueTriggerPrev: 'prev',
			valueTriggerNext: 'next',

			enableKeys: true,
			keyNext: 39,
			keyPrev: 37,

			enableSwipe: true,
			onSwipeLeft: function($currentSlide) {},
			onSwipeRight: function($currentSlide) {},

			sliderInitDelay: 1000,

			autoPlay: true,
			autoPlayTimeout: 7000,
			attrPauseAutoPlay: 'data-slide-pause-autoplay',

			videoAutoPlay: true,
			videoAutoPlayOnSlideStart: true,
			videoPluginDefaultBehavior: false,
			attrVideo: 'data-slide-video',
			attrVideoAutoPlay: 'data-slide-video-autoplay',

			onSlideInStart: function($currentSlide) {},
			onSlideInEnd: function($currentSlide) {},
			onSlideOutStart: function($currentSlide) {},
			onSlideOutEnd: function($currentSlide) {}
		}
	};

	// METHODS

	// Bind navigation keys
	$.f4slider.bindKeys = function() {
		$.f4slider.unbindKeys();

		$(window).bind('keyup.f4slider', function(e) {
			e.preventDefault();

			// Check if pressed key is in use, if not, ignore this stuff
			if ($.inArray(e.keyCode, $.f4slider.global.allKeys) == -1) {
				return;
			}

			// Get current most active slider
			var $activeSlider = $('[' + $.f4slider.global.attrKeysEnabled + ']').filter(':visible').filter(function() {
				var $thisSlider = $(this);

				if ($thisSlider.is('[' + $thisSlider.data('f4slider').config.attrSliderHidden + ']')) {
					return false;
				}

				var boundTop = $(window).scrollTop();
				var boundBottom = boundTop + $(window).height();
				var elementTop = $thisSlider.offset().top;
				var elementBottom = elementTop + $thisSlider.height();
				var isVisible = (elementTop <= boundBottom && elementBottom >= boundTop) || (elementBottom >= boundTop && elementTop <= boundBottom);

				return isVisible;
			}).first();

			// Bind keys
			if ($activeSlider.length) {
				var sliderConfig = $activeSlider.data('f4slider').config;

				if (e.keyCode == sliderConfig.keyNext) {
					e.preventDefault();
					$activeSlider.f4slider('next');
				}

				if (e.keyCode == sliderConfig.keyPrev) {
					e.preventDefault();
					$activeSlider.f4slider('previous');
				}
			}
		});
	}

	// Unbind navigation keys
	$.f4slider.unbindKeys = function() {
		$(window).unbind('keyup.f4slider');
	}

	// Main binding
	$.fn.f4slider = function(options) {

		// Video: Check if video plugin is available
		$.f4slider.global.videoPluginAvailable = (typeof $.video != 'undefined');

		// Overwrite default settings and validators
		var sliderConfig = null;
		var sliderAction = null;

		if (typeof options == 'string') {
			sliderAction = options;
		} else {
			sliderConfig = $.extend($.extend({}, $.f4slider.config), options);

			// Bind keys
			if (sliderConfig.enableKeys) {
				$.f4slider.bindKeys();
			}
		}


		// Bind each slider
		return this.each(function() {

			var sliderTimeout = null

			// Get config from slider instance
			if (typeof $(this).data('f4slider') !== 'undefined') {
				sliderConfig = $(this).data('f4slider').config;
				sliderTimeout = $(this).data('f4slider-timeout');
			}

			// Init slider variables
			var $slider = $(this);
			var sliderName = $slider.attr(sliderConfig.attrSlider);
			var $slides = $slider.find('[' + sliderConfig.attrSlide + ']');
			var $slides_videos = $slides.find('[' + sliderConfig.attrVideo + ']');
			var video_plugin_default = ($.f4slider.global.videoPluginAvailable && sliderConfig.videoPluginDefaultBehavior && $slides_videos.length);

			var $triggers = [];
			var $triggersRef = $('[' + sliderConfig.attrTriggerRef + '="' + sliderName + '"]');

			if ($triggersRef.length > 0) {
				$triggers = $triggersRef.find('[' + sliderConfig.attrTrigger + ']');
				if ($triggers.length === 0) {
					$triggers = $triggersRef;
				}
			} else {
				$triggers = $slider.find('[' + sliderConfig.attrTrigger + ']');
			}

			var slideCount = $slides.length;
			var slideMaxIndex = slideCount - 1;

			var $currentSlide = null;
			var $currentTrigger = null;
			var currentSlideIndex = 0;

			if (slideCount > 0) {
				$currentSlide = $slides.filter('[' + sliderConfig.attrSlideCurrent + ']');
				$currentTrigger = $triggers.filter('[' + sliderConfig.attrTriggerCurrent + ']');
				currentSlideIndex = $slides.index($currentSlide) == -1 ? 0 : $slides.index($currentSlide);
			}

			var isMouseOver = false;

			// METHOD: Init
			var init = function() {
				$slider.data('f4slider', {
					config: sliderConfig,
					sliderTimeout: sliderTimeout
				});

				$.f4slider.global.allKeys.push(sliderConfig.keyPrev);
				$.f4slider.global.allKeys.push(sliderConfig.keyNext);

				// Video: Init videos
				if (video_plugin_default) {
					$slides_videos.video();
					$currentSlide.find('[' + sliderConfig.attrVideo + '][' + sliderConfig.attrVideoAutoPlay + ']').video('play')
				}

				if (slideCount > 1) {
					if (sliderConfig.sliderInitDelay <= 0) {
						$slider.attr($.f4slider.global.attrKeysEnabled, '');
						$slider.attr(sliderConfig.attrInit, '');
						slide(currentSlideIndex);
						bind();
					} else {
						var delayTimeout = setTimeout(function() {
							$slider.attr($.f4slider.global.attrKeysEnabled, '');
							$slider.attr(sliderConfig.attrInit, '');
							slide(currentSlideIndex);
							bind();
						}, sliderConfig.sliderInitDelay);
					}
				} else if (slideCount == 1) {
					$slider.attr(sliderConfig.attrInit, '');
					slide(currentSlideIndex);
				}
			}

			// METHOD: Destroy
			var destroy = function() {
				$slider.removeData('f4slider');

				$slider.removeAttr($.f4slider.global.attrKeysEnabled);
				$slider.removeAttr(sliderConfig.attrInit);

				$slides.removeAttr(sliderConfig.attrSlideCurrent);
				$triggers.removeAttr(sliderConfig.attrTriggerCurrent);

				stopAutoplay();

				$slides.unbind('transitionEnd webkitTransitionEnd oTransitionEnd');
			}

			// METHOD: Bind
			var bind = function() {
				// Video: Bind events
				if (video_plugin_default) {
					$slides_videos.addVideoEvent(
						'play',
						function(e, $video) {
							stopAutoplay();
						}
					);

					/*$slides_videos.addVideoEvent(
						'pause',
						function(e, $video) {
							if(sliderConfig.autoPlay) {
								startAutoplay();
							}
						}
					);*/
				}

				$triggers.on('click', function(e) {
					e.preventDefault();
					e.stopPropagation();

					var $trigger = $(this);

					if (typeof $trigger.attr(sliderConfig.attrTriggerCurrent) == 'undefined') {
						var triggerType = $trigger.attr(sliderConfig.attrTrigger);
						var newIndex = parseInt(triggerType);

						if (!isNaN(newIndex)) {
							slide(newIndex);
						} else {
							if (triggerType == 'prev') {
								slidePrevious();
							} else {
								slideNext();
							}
						}
					}
				});

				if (sliderConfig.autoPlay) {
					$slider.find('[' + sliderConfig.attrPauseAutoPlay + ']').addBack('[' + sliderConfig.attrPauseAutoPlay + ']').bind('mouseenter', function(e) {
						e.stopPropagation();
						isMouseOver = true;

						stopAutoplay();

						$(this).one('mouseleave', function() {
							isMouseOver = false;
							startAutoplay();
						});
					});
				}

				if (sliderConfig.enableSwipe && typeof $slider.swipe != 'undefined') {
					$slider.swipe({
						swipeLeft: function() {
							slideNext();
							sliderConfig.onSwipeLeft($(this));
						},
						swipeRight: function() {
							slidePrevious();
							sliderConfig.onSwipeRight($(this));
						}
					});
				}
			}

			// METHOD: Start autoplay
			var startAutoplay = function() {
				stopAutoplay();

				if ($slides.length > 1) {
					$slider.data('f4slider-timeout', setTimeout(function() {
						slideNext();
					}, sliderConfig.autoPlayTimeout));
				}
			}

			// METHOD: Stop autoplay
			var stopAutoplay = function() {
				clearTimeout($slider.data('f4slider-timeout'));
			}

			// METHOD: Start video autoplay
			var startVideoAutoplay = function($currentSlide) {
				var $videos = $currentSlide.find('[' + sliderConfig.attrVideo + '][' + sliderConfig.attrVideoAutoPlay + ']');

				$videos.each(function() {
					var $video = $(this);

					// html5 video
					if ($video.prop('tagName').toLowerCase() == 'video') {
						//stopAutoplay();
						$video.get(0).play();

						if ($video.get(0).paused) {
							startAutoplay();
						}
					}

					// Youtube video
					if ($video.prop('tagName').toLowerCase() == 'iframe' && $video.attr('src').indexOf('youtu') !== -1) {
						stopAutoplay();

						var videoUrl = $video.attr('src');
						var videoUrlNew = videoUrl.replace('&amp;', '&').replace(/\autoplay=[0-9]{1}/, '').replace('?&', '?').replace('??', '?').replace(/[\?&]$/, '').replace('&', '&amp;');

						videoUrlNew = videoUrlNew + (videoUrlNew.indexOf('?') === -1 ? '?' : '&') + 'autoplay=1';

						$video.attr('src', videoUrlNew);
					}
				});

				//onended
			}

			// METHOD: Start video autoplay
			var stopVideoAutoplay = function($currentSlide) {
				var $videos = $currentSlide.find('[' + sliderConfig.attrVideo + ']');

				$videos.each(function() {
					var $video = $(this);

					// html5 video
					if ($video.prop('tagName').toLowerCase() == 'video') {
						$video.get(0).pause();
					}

					// Youtube video
					if ($video.prop('tagName').toLowerCase() == 'iframe' && $video.attr('src').indexOf('youtu') !== -1) {
						var videoUrl = $video.attr('src');
						var videoUrlNew = videoUrl.replace('&amp;', '&').replace(/\autoplay=[0-9]{1}/, '').replace('?&', '?').replace('??', '?').replace(/[\?&]$/, '').replace('&', '&amp;');

						$video.attr('src', videoUrlNew);
					}
				});
			}

			// METHOD: Slide
			var slide = function(newIndex) {
				if (sliderConfig.autoPlay && !isMouseOver) {
					startAutoplay();
				}

				// Set previous slide
				$previousSlide = $currentSlide;

				// Set direction attr
				if (typeof $previousSlide.attr(sliderConfig.attrSlide) != 'undefined') {
					if ($previousSlide.attr(sliderConfig.attrSlide) < newIndex) {
						$slider.attr(sliderConfig.attrSlideNext, '');
					} else {
						$slider.attr(sliderConfig.attrSlidePrev, '');
					}
				}

				// onSlideOutStart
				sliderConfig.onSlideOutStart($previousSlide);

				// Stop video autoplay
				stopVideoAutoplay($previousSlide);

				// onSlideOutEnd
				var outEndTriggered = false;

				transitionEndOne($previousSlide, function(e) {
					if (outEndTriggered) return false;

					$previousSlide.removeAttr(sliderConfig.attrSlideOut);

					$slider.removeAttr(sliderConfig.attrSlidePrev);
					$slider.removeAttr(sliderConfig.attrSlideNext);

					sliderConfig.onSlideOutEnd($previousSlide);

					outEndTriggered = true;
				});

				$currentSlide.attr(sliderConfig.attrSlideOut, '');
				$slides.removeAttr(sliderConfig.attrSlideCurrent);
				$triggers.removeAttr(sliderConfig.attrTriggerCurrent);

				currentSlideIndex = newIndex;
				$currentSlide = $slides.filter('[' + sliderConfig.attrSlide + '="' + currentSlideIndex + '"]');
				$currentSlide.attr(sliderConfig.attrSlideCurrent, '').attr(sliderConfig.attrSlideIn, '');

				$currentTrigger = $triggers.filter('[' + sliderConfig.attrTrigger + '="' + currentSlideIndex + '"]');
				$currentTrigger.attr(sliderConfig.attrTriggerCurrent, '');

				// onSlideInStart
				sliderConfig.onSlideInStart($currentSlide);

				// onSlideInEnd
				var inEndTriggered = false;

				// Start video autoplay
				if (sliderConfig.videoAutoPlayOnSlideStart) {
					startVideoAutoplay($currentSlide);
				}

				transitionEndOne($currentSlide, function(e) {
					if (inEndTriggered) return false;

					$currentSlide.removeAttr(sliderConfig.attrSlideIn);
					sliderConfig.onSlideInEnd($currentSlide);

					// Start video autoplay
					if (!sliderConfig.videoAutoPlayOnSlideStart) {
						startVideoAutoplay($currentSlide);
					}

					inEndTriggered = true;
				});
			}

			// METHOD: Slide next
			var slideNext = function() {
				var newIndex = currentSlideIndex + 1;

				if (newIndex > slideMaxIndex) {
					newIndex = 0;
				}

				slide(newIndex);
			}

			// METHOD: Slide previous
			var slidePrevious = function() {
				var newIndex = currentSlideIndex - 1;

				if (newIndex < 0) {
					newIndex = slideMaxIndex;
				}

				slide(newIndex);
			}

			// Transition end one
			var transitionEndOne = function($element, callback) {
				var triggered = false;

				$element.one('transitionend webkitTransitionEnd oTransitionEnd', function(e) {
					if (!triggered) {
						triggered = true;
						callback(e);
					}
				});

				// Fallback for no-transition
				if (!detectCssSupport('transition')) {
					$element.trigger('transitionend');
				}
			};

			// Detect css support
			var detectCssSupport = function(featurename) {
				var supported = false;
				var domPrefixes = 'Webkit Moz O ms Khtml'.split(' ');
				var elm = document.createElement('div');

				if (elm.style[featurename] !== undefined) {
					supported = true;
				}

				if (supported === false) {
					for (var i = 0; i < domPrefixes.length; i++) {
						if (elm.style[domPrefixes[i] + featurename] !== undefined) {
							supported = true;
							break;
						}
					}
				}

				return supported;
			}
			// Do action
			if (sliderAction === null) {
				init();
			} else {
				switch (sliderAction) {
					case 'previous':
						slidePrevious();

						break;

					case 'next':
						slideNext();

						break;

					case 'stopVideoAutoplay':
						stopVideoAutoplay($currentSlide);

						break;

					case 'startVideoAutoplay':
						startVideoAutoplay($currentSlide);

						break;

					case 'startAutoplay':
						startAutoplay();

						break;

					case 'stopAutoplay':
						stopAutoplay();

						break;

					case 'destroy':
						destroy();

						break;
				}
			}
		});

	};

}(jQuery));
