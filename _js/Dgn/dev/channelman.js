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
// チャネルインスペクタウィンドウ
// ************************

Dgn.ChannelWin = Ext.extend(Ext.Window, {
	initComponent: function() {
		var that = this;

		var hdls = {
			update: function(btn, evt) {
				var form = that.get('form').getForm();

				if (!form.isValid()) {
					Ext.Msg.alert('エラー', '入力内容に誤りがあります。もう一度、確認してください。');
					return false;
				}
	
//				form.updateRecord(that.rec);
				var vals = form.getValues();
				that.rec.set('title', vals.title);
				that.rec.set('channeltype', vals.channeltype);

		        that.hide();
			},
			cancel: function(btn, evt) {
	            that.hide();
			}
		};

		// パネル編集パネル
		var form = new Ext.form.FormPanel({
			itemId:			'form',
		    defaults:		{
		    	allowBlank:	false,
		    	width:		200
		    },
		    labelWidth:		80,
		    frame:			true,
		    items:			[
		    	{xtype: 'textfield', name: 'title', fieldLabel: 'チャネル名'},
		    	{xtype: 'radiogroup', id: 'channeltype', fieldLabel: 'レイアウト', columns: 1, vertical: true, items:[
		    		{boxLabel: 'カスケード',	name: 'channeltype', inputValue: 0},
		    		{boxLabel: 'フィット',	name: 'channeltype', inputValue: 1},
		    		{boxLabel: 'タブ',		name: 'channeltype', inputValue: 2},
		    		{boxLabel: '二段組み',	name: 'channeltype', inputValue: 11}
		    	]}
			]
		});

		var config = {
			title:			'チャネル編集',
		    layout:			'fit',
		    width:			400,
		    height:			340,
		    closeAction:	'hide',
		    plain: 			false,
		    modal:			true,
		    items:			form,
		    buttonAlign:	'center',
			buttons: [
				{text: '更新する',	handler: hdls.update},
				{text: 'キャンセル',	handler: hdls.cancel}
		    ]
		};

        // apply config
        Ext.apply(this, config);
        Ext.apply(this.initialConfig, config);

        // call parent
		Dgn.ChannelWin.superclass.initComponent.call(this);
	},
	setupForm: function(rec) {
		this.rec = rec;
		this.get('form').getForm().loadRecord(rec);
		getCmp('channeltype').setValue('channeltype', rec.get('channeltype'));		
	}
});
