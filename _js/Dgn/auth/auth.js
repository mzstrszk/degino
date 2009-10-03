/*
 * Degino Ver.1
 * Copyright (c) 2009 Y.Tokutomi
 * Licensed under GPLv3
 * http://www.gnu.org/licenses/gpl-3.0.html
 *
 * info@degino.com
 */

/*global Ext Dgn */

Dgn.AuthApp = Ext.extend(Dgn.AbstractApp, {
	constructor: function(cfg) {
		Dgn.AuthApp.superclass.constructor.apply(this, arguments);	

		Dgn.loginman.init();
		Dgn.registman.init();
		Dgn.authmenu.init();
	
		var temp = new Ext.Viewport({
			layout:		'border',
			defaults:	{border: false},
			items:	[{
				region:		'north',
				height:		62,
				baseCls:	'page_header'
			}, {
				region:		'center',
				layout:		'fit',
				items:		[Dgn.authmenu.panel]
			}, {
				region:		'south',
				height:		30,
				baseCls:	'page_footer',
				html:		'<p align="center" font="smaller">Copyright &copy; 2009 Degino All rights reserved.</p>'
			}]
		});
		Dgn.authmenu.login_check();
	
		if (msg) {
			Ext.Msg.alert('メッセージ', msg);
		}
	
		log('Hello');
	}
});

Ext.onReady(function(){
	var app = new Dgn.AuthApp();
});
