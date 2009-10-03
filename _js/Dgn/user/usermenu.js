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
// メニュービュー
// ************************

Dgn.AppliMenuView = Ext.extend(Ext.DataView, {
	initComponent: function() {
		var that = this;

		var tpl = new Ext.XTemplate(
			'<dl>',
		    '<tpl for=".">',
		        '<dd class="thumb-wrap">',
					'<img src="_resources/usermode.png" />',
					'<h4>{label}</h4>',
					'<h5>{owner_name}</h5>',
					'<p>{remark}</p>',
				'</dd>',
		    '</tpl>',
		    '</dl>'
		);

		var config = {
			tpl:			tpl,
	        autoHeight:		true,
	        multiSelect:	false,
	        singleSelect:	true,
	        overClass:		'over',
	        itemSelector:	'dd.thumb-wrap',
			emptyText:		'No applications to display.'
		};

        // apply config
        Ext.apply(this, config);
        Ext.apply(this.initialConfig, config);

        // call parent
		Dgn.AppliMenuView.superclass.initComponent.call(this);
		
		// attach events
		this.on('click', function(dv, index, node, evt) {
			var rec = that.store.getAt(index);
			this.fireEvent('awake', rec);
		});

		this.on('activate', function(pnl) {
			switch (this.filter) {
			case 'myappli':
				this.store.filter('owner_id', Dgn.G_USER._id);
				break;
			case 'pubappli':
				this.store.filter('isPublic', true);
				break;
			}
		});
	}
});
Ext.reg('applimenu', Dgn.AppliMenuView);

// ************************
// メニュータブ
// ************************
Dgn.UserMenu = Ext.extend(Ext.TabPanel, {
	initComponent: function() {
		var that = this;

		var store = new Dgn.DevStore({
			storeId:	'StoreAppli',
			baseParams:	{_MSG: 'SELECT', _MODEL: 'Appli2'},
			autoLoad:	true,
			fields:		[
				'_id',
				'isPublic',
				'owner_id',
				{name:'owner_name',	renderer:Ext.util.Format.htmlEncode},
				{name:'label',		renderer:Ext.util.Format.htmlEncode},
				{name:'remark',		renderer:Ext.util.Format.htmlEncode}
			]
		});

		var config = {
			id:			'menu',
			activeTab:	0,
			defaults:	{padding: '10px'},
			items:		[{
				xtype:		'applimenu',
				title:		'マイアプリ',
				autoScroll:	true,
				itemId:		'myappli',
				filter:		'myappli',
				store:		store
			}, {
				xtype:		'applimenu',
				title:		'公開アプリ',
				autoScroll:	true,
				itemId:		'pubappli',
				filter:		'pubappli',
				store:		store
			}]
		};

        // apply config
        Ext.apply(this, config);
        Ext.apply(this.initialConfig, config);

        // call parent
		Dgn.UserMenu.superclass.initComponent.call(this);

		// attache events
		this.on('render', function(cmp) {
			this.relayEvents(this.get('myappli'), ['awake']);
			this.relayEvents(this.get('pubappli'), ['awake']);
		}, this);

		this.on('tabchange', function(pnl, tab) {
			tab.fireEvent('activate');
		});

		this.on('load', function(store, recs, opt) {
			store.filter('owner_id', that.app.user._id);
		});
	}
});
