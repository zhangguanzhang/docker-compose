/**
 * @copyright (c) 2016 Joas Schilling <coding@schilljs.com>
 *
 * @author Joas Schilling <coding@schilljs.com>
 *
 * This file is licensed under the Affero General Public License version 3 or
 * later. See the COPYING file.
 */

(function() {
	OCA.Activity = OCA.Activity || {};

	OCA.Activity.RichObjectStringParser = {
		avatarsEnabled: true,

		_fileTemplate: '<a class="filename has-tooltip" href="{{link}}" title="{{title}}">{{name}}</a>',
		_fileNoPathTemplate: '<a class="filename" href="{{link}}">{{name}}</a>',
		_fileRootTemplate: '<a class="filename has-tooltip" href="{{link}}" title="' + t('activity', 'Home') + '"><span class="icon icon-home"></span></a>',

		_systemTagTemplate: '<strong class="systemtag">{{name}}</strong>',

		_emailTemplate: '<a class="email" href="mailto:{{id}}">{{name}}</a>',

		_userLocalTemplate: '<span class="avatar-name-wrapper" data-user="{{id}}"><div class="avatar" data-user="{{id}}" data-user-display-name="{{name}}"></div><strong>{{name}}</strong></span>',
		_userRemoteTemplate: '<strong>{{name}}</strong>',

		_openGraphTemplate: '{{#if link}}<a href="{{link}}">{{/if}}<div id="opengraph-{{id}}" class="opengraph">' +
		'{{#if thumb}}<div class="opengraph-thumb" style="background-image: url(\'{{thumb}}\')"></div>{{/if}}' +
		'<div class="opengraph-name {{#if thumb}}opengraph-with-thumb{{/if}}">{{name}}</div>' +
		'<div class="opengraph-description {{#if thumb}}opengraph-with-thumb{{/if}}">{{description}}</div>' +
		'<span class="opengraph-website">{{website}}</span></div>{{#if link}}</a>{{/if}}',

		_unknownTemplate: '<strong>{{name}}</strong>',
		_unknownLinkTemplate: '<a href="{{link}}">{{name}}</a>',

		/**
		 * @param {string} subject
		 * @param {Object} parameters
		 * @returns {string}
		 */
		parseMessage: function(subject, parameters) {
			var self = this,
				regex = /\{([a-z0-9]+)\}/gi,
				matches = subject.match(regex);

			_.each(matches, function(parameter) {
				parameter = parameter.substring(1, parameter.length - 1);
				var parsed = self.parseParameter(parameters[parameter]);

				subject = subject.replace('{' + parameter + '}', parsed);
			});

			return subject;
		},

		/**
		 * @param {Object} parameter
		 * @param {string} parameter.type
		 * @param {string} parameter.id
		 * @param {string} parameter.name
		 * @param {string} parameter.link
		 */
		parseParameter: function(parameter) {
			switch (parameter.type) {
				case 'file':
					return this.parseFileParameter(parameter);

				case 'systemtag':
					if (!this.systemTagTemplate) {
						this.systemTagTemplate = Handlebars.compile(this._systemTagTemplate);
					}

					var name = parameter.name;
					if (parameter.visibility !== '1') {
						name = t('activity', '{name} (invisible)', parameter);
					} else if (parameter.assignable !== '1') {
						name = t('activity', '{name} (restricted)', parameter);
					}

					return this.systemTagTemplate({
						name: name
					});

				case 'email':
					if (!this.emailTemplate) {
						this.emailTemplate = Handlebars.compile(this._emailTemplate);
					}

					return this.emailTemplate(parameter);

				case 'open-graph':
					if (!this.openGraphTemplate) {
						this.openGraphTemplate = Handlebars.compile(this._openGraphTemplate);
					}

					return this.openGraphTemplate(parameter);

				case 'user':
					if (_.isUndefined(parameter.server)) {
						if (!this.userLocalTemplate) {
							this.userLocalTemplate = Handlebars.compile(this._userLocalTemplate);
						}
						return this.userLocalTemplate(parameter);
					}

					if (!this.userRemoteTemplate) {
						this.userRemoteTemplate = Handlebars.compile(this._userRemoteTemplate);
					}

					return this.userRemoteTemplate(parameter);

				default:
					if (!_.isUndefined(parameter.link)) {
						if (!this.unknownLinkTemplate) {
							this.unknownLinkTemplate = Handlebars.compile(this._unknownLinkTemplate);
						}
						return this.unknownLinkTemplate(parameter);
					}

					if (!this.unknownTemplate) {
						this.unknownTemplate = Handlebars.compile(this._unknownTemplate);
					}
					return this.unknownTemplate(parameter);
			}
		},

		/**
		 * @param {Object} parameter
		 * @param {string} parameter.type
		 * @param {string} parameter.id
		 * @param {string} parameter.name
		 * @param {string} parameter.path
		 * @param {string} parameter.link
		 */
		parseFileParameter: function(parameter) {
			if (!this.fileTemplate) {
				this.fileTemplate = Handlebars.compile(this._fileTemplate);
				this.fileNoPathTemplate = Handlebars.compile(this._fileNoPathTemplate);
				this.fileRootTemplate = Handlebars.compile(this._fileRootTemplate);
			}

			if (parameter.path === '') {
				return this.fileRootTemplate(parameter);
			}

			var lastSlashPosition = parameter.path.lastIndexOf('/'),
				firstSlashPosition = parameter.path.indexOf('/');
			parameter.path = parameter.path.substring(firstSlashPosition === 0 ? 1 : 0, lastSlashPosition);

			if (!parameter.link) {
				parameter.link = OC.generateUrl('/f/{fileId}', {fileId: parameter.id})
			}

			if (parameter.path === '' || parameter.path === '/') {
				return this.fileNoPathTemplate(parameter);
			}
			return this.fileTemplate(_.extend(parameter, {
				title: parameter.path.length === 0 ? '' : t('activity', 'in {path}', parameter)
			}));
		}
	};

})();


/*
 * Copyright (c) 2015
 *
 * This file is licensed under the Affero General Public License version 3
 * or later.
 *
 * See the COPYING-README file.
 *
 */

(function() {
	/**
	 * @class OCA.Activity.ActivityModel
	 * @classdesc
	 *
	 * Displays activity information for a given file
	 *
	 */
	var ActivityModel = OC.Backbone.Model.extend(/** @lends OCA.Activity.ActivityModel.prototype */{
		/**
		 *
		 * @returns int UNIX milliseconds timestamp
		 */
		getUnixMilliseconds: function() {
			if (_.isUndefined(this.unixMilliseconds)) {
				this.unixMilliseconds = moment(this.get('datetime')).valueOf();
			}
			return this.unixMilliseconds;
		},

		/**
		 * @returns string E.g. "seconds ago"
		 */
		getRelativeDate: function () {
			return OC.Util.relativeModifiedDate(this.getUnixMilliseconds());
		},

		/**
		 * @returns string E.g. "April 26, 2016 10:53 AM"
		 */
		getFullDate: function () {
			return OC.Util.formatDate(this.getUnixMilliseconds());
		}
	});

	OCA.Activity = OCA.Activity || {};
	OCA.Activity.ActivityModel = ActivityModel;
})();



/*
 * Copyright (c) 2015
 *
 * This file is licensed under the Affero General Public License version 3
 * or later.
 *
 * See the COPYING-README file.
 *
 */

(function() {

	OCA.Activity = OCA.Activity || {};

	/**
	 * @class OCA.Activity.ActivityCollection
	 * @classdesc
	 *
	 * Displays activity information for a given file
	 *
	 */
	var ActivityCollection = OC.Backbone.Collection.extend(
		/** @lends OCA.Activity.ActivityCollection.prototype */ {

		firstKnownId: 0,
		lastGivenId: 0,
		hasMore: false,

		/**
		 * Id of the file for which to filter activities by
		 *
		 * @var int
		 */
		_objectId: null,

		/**
		 * Type of the object to filter by
		 *
		 * @var string
		 */
		_objectType: null,

		model: OCA.Activity.ActivityModel,

		/**
		 * Sets the object id to filter by or null for all.
		 * 
		 * @param {int} objectId file id or null
		 */
		setObjectId: function(objectId) {
			this._objectId = objectId;
			this.firstKnownId = 0;
			this.lastGivenId = 0;
			this.hasMore = false;
		},

		/**
		 * Sets the object type to filter by or null for all.
		 * 
		 * @param {string} objectType string
		 */
		setObjectType: function(objectType) {
			this._objectType = objectType;
			this.firstKnownId = 0;
			this.lastGivenId = 0;
			this.hasMore = false;
		},

		/**
		 *
		 * @param ocsResponse
		 * @param response
		 * @returns {Array}
		 */
		parse: function(ocsResponse, response) {
			this._saveHeaders(response.xhr.getAllResponseHeaders());

			if (response.xhr.status === 304) {
				// No activities found
				return [];
			}

			return ocsResponse.ocs.data;
		},

		/**
		 * Read the X-Activity-First-Known and X-Activity-Last-Given headers
		 * @param headers
		 */
		_saveHeaders: function(headers) {
			var self = this;
			this.hasMore = false;

			headers = headers.split("\n");
			_.each(headers, function (header) {
				var parts = header.split(':');
				if (parts[0].toLowerCase() === 'x-activity-first-known') {
					self.firstKnownId = parseInt(parts[1].trim(), 10);
				} else if (parts[0].toLowerCase() === 'x-activity-last-given') {
					self.lastGivenId = parseInt(parts[1].trim(), 10);
				} else if (parts[0].toLowerCase() === 'link') {
					self.hasMore = true;
				}
			});
		},

		url: function() {
			var query = {
				format: 'json'
			};
			var url = OC.linkToOCS('apps/activity/api/v2/activity', 2) + 'filter';
			if (this.lastGivenId) {
				query.since = this.lastGivenId;
			}
			if (this._objectId && this._objectType) {
				query.object_type = this._objectType;
				query.object_id = this._objectId;
			}
			url += '?' + OC.buildQueryString(query);
			return url;
		}
	});

	OCA.Activity.ActivityCollection = ActivityCollection;
})();



/*
 * Copyright (c) 2015
 *
 * This file is licensed under the Affero General Public License version 3
 * or later.
 *
 * See the COPYING-README file.
 *
 */

(function() {
	var TEMPLATE =
		'<div class="activity-section">' +
		'<div class="loading hidden" style="height: 50px"></div>' +
		'<div class="emptycontent">' +
		'    <div class="icon-activity"></div>' +
		'    <p>{{emptyMessage}}</p>' +
		'</div>' +
		'<ul class="activities hidden">' +
		'</ul>' +
		'<input type="button" class="showMore" value="{{moreLabel}}"' +
		'</div>';
	var ACTIVITY_TEMPLATE =
		'    <li class="activity box">' +
		'        <div class="activity-icon">' +
		'        {{#if icon}}' +
		'          <img src="{{icon}}" alt="">' +
		'        {{/if}}' +
		'        </div>' +
		'        <div class="activitysubject">{{{subject}}}</div>' +
		'        <span class="activitytime has-tooltip live-relative-timestamp" data-timestamp="{{timestamp}}" title="{{formattedDateTooltip}}">{{formattedDate}}</span>' +
		'        <div class="activitymessage">{{{message}}}</div>' +
		'    </li>';

	/**
	 * @class OCA.Activity.ActivityTabView
	 * @classdesc
	 *
	 * Displays activity information for a given file
	 *
	 */
	var ActivityTabView = OCA.Files.DetailTabView.extend(/** @lends OCA.Activity.ActivityTabView.prototype */ {
		id: 'activityTabView',
		className: 'activityTabView tab',

		events: {
			'click .showMore': '_onClickShowMore'
		},

		_loading: false,
		_plugins: [],

		initialize: function() {
			this.collection = new OCA.Activity.ActivityCollection();
			this.collection.setObjectType('files');
			this.collection.on('request', this._onRequest, this);
			this.collection.on('sync', this._onEndRequest, this);
			this.collection.on('error', this._onError, this);
			this.collection.on('add', this._onAddModel, this);

			this._plugins = OC.Plugins.getPlugins('OCA.Activity.RenderingPlugins');
			_.each(this._plugins, function(plugin) {
				if (_.isFunction(plugin.initialize)) {
					plugin.initialize();
				}
			});
		},

		template: function(data) {
			if (!this._template) {
				this._template = Handlebars.compile(TEMPLATE);
			}
			return this._template(data);
		},

		get$: function() {
			return this.$el;
		},

		getLabel: function() {
			return t('activity', 'Activities');
		},

		setFileInfo: function(fileInfo) {
			this._fileInfo = fileInfo;
			if (this._fileInfo) {
				this.collection.setObjectId(this._fileInfo.get('id'));
				this.collection.reset();
				this.collection.fetch();

				_.each(this._plugins, function(plugin) {
					if (_.isFunction(plugin.setFileInfo)) {
						plugin.setFileInfo('files', fileInfo.get('id'));
					}
				});
			} else {
				this.collection.reset();

				_.each(this._plugins, function(plugin) {
					if (_.isFunction(plugin.resetFileInfo)) {
						plugin.resetFileInfo();
					}
				});
			}
		},

		_onError: function() {
			var $emptyContent = this.$el.find('.emptycontent');
			$emptyContent.removeClass('hidden');
			$emptyContent.find('p').text(t('activity', 'An error occurred while loading activities'));
		},

		_onRequest: function() {
			if (this.collection.lastGivenId === 0) {
				this.render();
			}
			this.$el.find('.showMore').addClass('hidden');
		},

		_onEndRequest: function() {
			this.$container.removeClass('hidden');
			this.$el.find('.loading').addClass('hidden');
			if (this.collection.length) {
				this.$el.find('.emptycontent').addClass('hidden');
			}
			if (this.collection.hasMore) {
				this.$el.find('.showMore').removeClass('hidden');
			}
		},

		_onClickShowMore: function() {
			this.collection.fetch({
				reset: false
			});
		},

		/**
		 * Format an activity model for display
		 *
		 * @param {OCA.Activity.ActivityModel} activity
		 * @return {Object}
		 */
		_formatItem: function(activity) {

			var subject = activity.get('subject'),
				subject_rich = activity.get('subject_rich');
			if (subject_rich[0].length > 1) {
				subject = OCA.Activity.RichObjectStringParser.parseMessage(subject_rich[0], subject_rich[1]);
			}
			var message = activity.get('message'),
				message_rich = activity.get('message_rich');
			if (message_rich[0].length > 1) {
				message = OCA.Activity.RichObjectStringParser.parseMessage(message_rich[0], message_rich[1]);
			}

			var output = {
				subject: subject,
				formattedDate: activity.getRelativeDate(),
				formattedDateTooltip: activity.getFullDate(),
				timestamp: moment(activity.get('datetime')).valueOf(),
				message: message,
				icon: activity.get('icon')
			};

			/**
			 * Disable previews in the rightside bar,
			 * it's always the same image anyway.
			 if (activity.has('previews')) {
					output.previews = _.map(activity.get('previews'), function(data) {
						return {
							previewClass: data.isMimeTypeIcon ? 'preview-mimetype-icon': '',
							source: data.source
						};
					});
				}
			 */
			return output;
		},

		activityTemplate: function(params) {
			if (!this._activityTemplate) {
				this._activityTemplate = Handlebars.compile(ACTIVITY_TEMPLATE);
			}

			return this._activityTemplate(params);
		},

		_onAddModel: function(model, collection, options) {
			var $el = $(this.activityTemplate(this._formatItem(model)));

			_.each(this._plugins, function(plugin) {
				if (_.isFunction(plugin.prepareModelForDisplay)) {
					plugin.prepareModelForDisplay(model, $el, 'ActivityTabView');
				}
			});

			if (!_.isUndefined(options.at) && collection.length > 1) {
				this.$container.find('li').eq(options.at).before($el);
			} else {
				this.$container.append($el);
			}

			this._postRenderItem($el);
		},

		_postRenderItem: function($el) {
			$el.find('.avatar').each(function() {
				var element = $(this);
				if (element.data('user-display-name')) {
					element.avatar(element.data('user'), 21, undefined, false, undefined, element.data('user-display-name'));
				} else {
					element.avatar(element.data('user'), 21);
				}
			});
			$el.find('.avatar-name-wrapper').each(function() {
				var element = $(this);
				var avatar = element.find('.avatar');
				var label = element.find('strong');

				$.merge(avatar, label).contactsMenu(element.data('user'), 0, element);
			});
			$el.find('.has-tooltip').tooltip({
				placement: 'bottom'
			});
		},


		/**
		 * Renders this details view
		 */
		render: function() {
			if (this._fileInfo) {
				this.$el.html(this.template({
					emptyMessage: t('activity', 'No activity yet'),
					moreLabel: t('activity', 'Load more activities')
				}));
				this.$container = this.$el.find('ul.activities');
			}
		}
	});

	OCA.Activity = OCA.Activity || {};
	OCA.Activity.ActivityTabView = ActivityTabView;
})();


/*
 * Copyright (c) 2015
 *
 * This file is licensed under the Affero General Public License version 3
 * or later.
 *
 * See the COPYING-README file.
 *
 */

(function(OCA) {

var FilesPlugin = {
	attach: function(fileList) {
		fileList.registerTabView(new OCA.Activity.ActivityTabView({order: -50}));
	}
};

OC.Plugins.register('OCA.Files.FileList', FilesPlugin);

})(OCA);



