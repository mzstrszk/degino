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

var build2 = function(channel_id, channeltype) {
	var that = this;

	// ストア構築
	Ext.Ajax.request({
		url:		'/UserStore',
		params:		{_id: channel_id},
		success:	function(res, opt) {
//			Ext.log(res.responseText);
	 		var cfgs	= Ext.util.JSON.decode(res.responseText);
	 		Ext.each(cfgs, function(it, i, items) {
	 			storeman.get2(it);
	 		});
		}
	});

	var channels = {
		0:	'pnlanchor',
		1:	'pnlcard',
		2:	'pnltab',
		11:	'pnlcolumn2',
		91:	'pnlfit'
	};

	// パネル構築
	Ext.Ajax.request({
		url:		'/UserPanel',
		params:		{_id: channel_id},
		success:	function(res, opt) {
//			Ext.log(res.responseText);
	 		var panels	= Ext.util.JSON.decode(res.responseText);

			// ワークエリアのセットアップ
			if (channeltype == 1 && panels.length < 2) {
				channeltype = 91;
			}

			var temp = new Ext.Panel({
				xtype:	channels[channeltype],
				id:		'WORK' + channel_id,
				items:	panels
			});
			
			temp.render(document.body);
		}
	});
};

function test() {

/*
	Ext.Ajax.request({
//		url:		'/UserStore',
		url:		'/UserPanel',
		params:		{_id: 3},
		success:	function(res, opt) {
			Ext.log(res.responseText);
		}
	});
*/
	build2(3, 11);


	Ext.log('hello');
}

// ************************
// ファーストハンドラー
// ************************

Ext.onReady(function(){
	test();
});
