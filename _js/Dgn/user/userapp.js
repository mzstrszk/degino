// Charset:utf-8 Tab:4
/*
 * Degino Ver.1
 * Copyright (c) 2009 Y.Tokutomi
 * Licensed under GPLv3
 * http://www.gnu.org/licenses/gpl-3.0.html
 *
 * info@degino.com
 */

/*global Ext Dgn */

var anim = function(el, callback) {
	var width = el.getWidth();
	
	var close_anim = {
	    duration:	0.3,
	    easing:		'easeNone',
	    callback:	function() {
	    	callback();
			el.setWidth(width, {
			    duration:	0.3,
			    easing:		'easeNone'
			});
		}
	};

	el.setWidth(0, close_anim);
};

// ************************
// チャネルリスト定義
// ************************

Dgn.Channel = Ext.extend(Dgn.Grid, {
	initComponent: function() {

		// チャネル一覧ストア
		var store = new Ext.data.JsonStore({
			storeId:	'StoreChannel',
			url:		'/DevAjax',
			baseParams:	{_MSG: 'SELECT', _MODEL: 'Channel'},
			root:		'recs',
			fields:		[
				'_id', 'title', 'channeltype', 'remark',
				{name:'created', type:'date'}, {name:'updated', type:'date'},
				'disabled'
			]
		});

		var config = {
			store:		store,
			defaults:	{
				renderer:	Ext.util.Format.htmlEncode
			},
			columns:	[
//				new Ext.grid.RowNumberer(),
				{id:'title',	header: 'チャネル名', dataIndex: 'title'}
			],
			viewConfig:	{forceFit: true, headersDisabled:true}
		};

        // apply config
        Ext.apply(this, config);
        Ext.apply(this.initialConfig, config);

        // call parent
		Dgn.Channel.superclass.initComponent.call(this);

		// attache events
	}
});
Ext.reg('channel', Dgn.Channel);

// ************************
// アプリ定義
// ************************

Dgn.Appli = Ext.extend(Ext.Panel, {
	initComponent: function() {
		var that = this;

		var config = {
			layout:		'border',
			title:		'アプリケーションエリア',
			border:		false,
			items:		[{
				region:		'west',
				xtype:		'channel',
				itemId:		'channel',
				layout:		'fit',
				split:		true,
				width:		200
			 }, {
				region:		'center',
			 	xtype:		'workarea',
				itemId:		'workarea'
			}],
			tools:	[
				{id:'close', handler: function(btn, evt) {that.fireEvent('sleep');}}
			]
		};

        // apply config
        Ext.apply(this, config);
        Ext.apply(this.initialConfig, config);

        // call parent
		Dgn.Appli.superclass.initComponent.call(this);

		// attache events
		this.on('render', function(cmp) {
			Dgn.util.addChild(this.get('channel'), this.get('workarea'));
		}, this);
	},
	awake: function(appli_id, label) {
		var that = this;

		getStore('Channel').load({params: {_PARENT: appli_id}});

		this.setTitle(label);
	},
	active: function(cmp_id) {
		this.get('workarea').getLayout().setActiveItem(cmp_id);
	}
});
