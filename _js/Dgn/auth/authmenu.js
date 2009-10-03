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
// メニュー管理
// ************************

Dgn.authmenu = {
	init: function() {
		var that = this;

		var move = function(el, url) {
			var params	= {_MSG:'_CHECK'};
			var success = function(res, opt) {
		 		var ret	= Ext.util.JSON.decode(res.responseText);
				if (ret.success) {
					var link = function() {
						location.replace(url);
					};
	
					// Element animation options object
					var anime = {
					    duration:	0.5,
					    easing:		'easeNone',
					    callback:	link,
					    scope:		this
					};
					// animation with some options set
					that.panel.getEl().setWidth(0, anime);
				} else {
					Dgn.loginman.win.show(el);
				}
			};
		
			Ext.Ajax.request({
				method:		'POST',
				url:		'/Auth',
				params:		params,
				success:	success,
				failure:	failure_dialogue
			});
		};

		var hdls = {
			regist: function(btn, evt) {
				Dgn.registman.win.show(btn.getEl());
			},
			login: function(btn, evt) {
				Dgn.loginman.win.show(btn.getEl());
			}
		};

		var menustore = new Ext.data.ArrayStore({
			fields:	['title', 'image', 'description'],
			data: [
				['作成モード',		'_resources/devmode.png',	'アプリーケションを作るモードです。'],
				['ユーザーモード',	'_resources/usermode.png',	'作ったアプリケーションを使うモードです。']
			]
		});

		var tpl = new Ext.XTemplate(
			'<dl>',
		    '<tpl for=".">',
		        '<dd class="thumb-wrap">',
					'<img src="{image}" />',
					'<h4>{title}</h4>',
					'<p>{description}</p>',
				'</dd>',
		    '</tpl>',
		    '</dl>',
		    '<div class="x-clear"></div>'
		);

		var menupanel = new Ext.DataView({
			id:				'menu',
			store:			menustore,
			tpl:			tpl,
	        autoHeight:		true,
	        multiSelect:	false,
	        singleSelect:	true,
	        overClass:		'over',
	        itemSelector:	'dd.thumb-wrap',
			emptyText:		'No images to display',
	        listeners:	{
	        	click: function(dv, index, node, evt) {
		        	switch (index) {
		        	case 0:
						move(node, '/Dev');
		        		break;
		        	case 1:
						move(node, '/User');
		        		break;
		        	}
        		}
        	}
		});

		var notepanel = new Ext.Panel({
			frame:		false,
			border:		false,
			width:		400,
			style:		{fontSize: 'small'},
			padding:	20,
			html:		'<ul>'+
						'<li>- "Degino" の利用は無料です。</li>'+
						'<li>- 開発中のため、仕様は予告なく変更されることをご了承ください。</li>'+
						'<li>- "Degino" は<a href="http://code.google.com/p/degino/">オープンソースプロジェクト<a>です。'+
						'バグ報告、要望などは<a href="http://code.google.com/p/degino/issues/">こちら</a>へお願いします。</li>'+
						'<li>- 他、お問い合わせは、お気軽に <a href="http://www.degino.com/">"Degino"<a> まで。</li>'+
						'</ul>'
		});

		var demopanel = new Ext.Panel({
			title:			'Degino Demo',
			width:			427,
			collapsible:	true,
			html:			'<object width="425" height="344"><param name="movie" value="http://www.youtube.com/v/KBB0ISIlK6c&hl=ja&fs=1&"></param><param name="allowFullScreen" value="true"></param><param name="allowscriptaccess" value="always"></param><embed src="http://www.youtube.com/v/KBB0ISIlK6c&hl=ja&fs=1&" type="application/x-shockwave-flash" allowscriptaccess="always" allowfullscreen="true" width="425" height="344"></embed></object>'
		});

		this.panel = new Ext.Panel({
			layout:	'border',
			items:	[{
				region:		'north',
				frame:		false,
				border:		false,
				width:		'auto',
				style:		'font-size:xx-large; text-align:center;',
				html:		'Simplicity web application prototyping tool "Degino"'
			},{
				region:		'center',
				border:		false,
				padding:	20,
				autoScroll:	true,
				items:		[menupanel, {
					layout:	'hbox',
					border:	false,
					items:	[notepanel, demopanel]
				}]
			}, {
				region:		'south',
				height:		30,
				frame:		false,
				border:		false,
				width:		'auto',
				style:		'text-align:center;',
				html:		'Powered by Ext JS & Google App Engine'
			}],
			tbar:	[
				'->',
				{id: 'regist',	text: 'ユーザー登録',	handler: hdls.regist},
				{id: 'login',	text: 'ログイン',		handler: hdls.login},
			 	{id: 'logout',	text: 'ログアウト',	handler: logout,	hidden: true}
			]
		});
	},
	login_check: function() {
		var that = this;

		var params	= {_MSG:'_CHECK'};
		var success = function(res, opt) {
	 		var ret	= Ext.util.JSON.decode(res.responseText);
	 		that.btn_status(ret.success);
		};
	
		Ext.Ajax.request({
			method:		'POST',
			url:		'/Auth',
			params:		params,
			success:	success,
			failure:	failure_dialogue
		});
	},
	btn_status: function(loggedin) {
		if (loggedin) {
			getCmp('login').hide();
			getCmp('regist').hide();
			getCmp('logout').show();
		} else {
			getCmp('login').show();
			getCmp('logout').hide();
		}
	}
};
