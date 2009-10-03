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


// ************************
// ユーザーモードボディ定義
// ************************

Dgn.UserBody = Ext.extend(Ext.Panel, {
	initComponent: function() {
		var config = {
			layout:			'card',
			activeItem:		0,
			items:			[
				new Dgn.UserMenu({
					itemId:	'usermenu'
				}),
				new Dgn.Appli({
					itemId:	'appli'
				})
			]
		};

        // apply config
        Ext.apply(this, config);
        Ext.apply(this.initialConfig, config);

        // call parent
		Dgn.UserBody.superclass.initComponent.call(this);
		
		// attache events
		this.get('usermenu').on('awake', this.onAwake, this);
		this.get('appli').on('sleep', this.onSleep, this);
	},
	change: function(num) {
		var that	= this;
		var el		= this.getEl();
		var width	= el.getWidth();

		var close_anim = {
		    duration:	0.3,
		    easing:		'easeNone',
		    callback:	function() {
		    	that.getLayout().setActiveItem(num);

				el.setWidth(width, {
				    duration:	0.3,
				    easing:		'easeNone'
				});
			}
		};

		el.setWidth(0, close_anim);
	},
	onAwake: function(rec) {
		this.get('appli').awake(rec.get('_id'), rec.get('label'));
		this.change(1);
	},
	onSleep: function() {
		this.change(0);
	}
});

// ************************
// ユーザーモードアプリケーション
// ************************

Dgn.UserApp = function() {
};
Ext.extend(Dgn.UserApp, Dgn.AbstractApp, {
	initApp: function() {
		Dgn.UserApp.superclass.initApp.apply(this, arguments);

		var hdls = {
			back: function(btn, evt) {
				location.replace('/Auth');
			}
		};

		var temp = new Ext.Viewport({
			layout:	'Border',
			items:	[{
				region:		'north',
				height:		62,
				baseCls:	'page_header',
				html:		'<div align="right">ユーザーモード</div>'
			}, {
				region:		'center',
				layout:		'fit',
				border:		false,
				items:		[new Dgn.UserBody({
					id:		'userbody'
				})],
				tbar:	[
					{xtype: 'btnreturn'},
					'->',
					{xtype: 'btnlogout'}
				]
			 }, {
				region:		'south',
				height:		30,
				baseCls:	'page_footer',
				html:		'<p align="center" font="smaller">Copyright &copy; 2009 Degino All rights reserved.</p>'
			 }]
		});
	
		log('Hello');
	}
});

// ************************
// ファーストハンドラー
// ************************

Ext.onReady(function(){
	var app = new Dgn.UserApp();
	app.initApp();
});
