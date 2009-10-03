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
// メニュー定義
// ************************
Dgn.Devmenu = Ext.extend(Ext.DataView, {
	initComponent: function() {
		var that = this;

		this.appliwin 	= new Dgn.AppliWin({app: this.initialConfig.app});
		this.filewin	= new Dgn.FileWin({app: this.initialConfig.app});

		var menuStore = new Ext.data.ArrayStore({
			fields:	['title', 'image', 'description', 'win'],
			data: [
				['ファイル作成',		'_resources/devmode.png',	'ファイルとテーブルを作ります。', this.filewin],
				['アプリケーション作成',	'_resources/devmode.png',	'画面に表示する部品を選びます。', this.appliwin]
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

		var config = {
			id:				'menu',
			store:			menuStore,
			tpl:			tpl,
	        autoHeight:		true,
	        multiSelect:	false,
	        singleSelect:	true,
	        overClass:		'over',
	        itemSelector:	'dd.thumb-wrap',
			emptyText:		'No images to display'
		};

        // apply config
        Ext.apply(this, config);
        Ext.apply(this.initialConfig, config);

        // call parent
		Dgn.Devmenu.superclass.initComponent.call(this);

		// attach events
		this.on('click', function(dv, index, node, evt) {
			var rec = dv.getStore().getAt(index);
			rec.get('win').show(node);
		});
	}
});
