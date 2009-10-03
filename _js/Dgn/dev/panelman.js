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
// パネルインスペクタウィンドウ
// ************************
Dgn.PanelWin = Ext.extend(Ext.Window, {
	initComponent: function() {
		var that = this;

		// パネル編集パネル
		var form = new Ext.form.FormPanel({
			itemId:			'form',
		    defaults:		{
		    	xtype:		'textfield',
		    	allowBlank:	false,
		    	width:		200
		    },
		    labelWidth:		80,
		    frame:			true,
		    items:			[
		    	{name: 'title',			fieldLabel: 'パネル名'},
		    	{name: 'file_name',		fieldLabel: 'ファイル名',	readOnly: true},
				{
					itemId:		'paneltype',
					name:		'paneltype',
 	                xtype:		'radiogroup',
	                fieldLabel:	'表示形式',
	                allowBlank:	false,
	                columns:	3,
	                width:		300,
//	                anchor:		'90%',
	                items: [
			    		{boxLabel: '表形式',			name: 'paneltype',	inputValue:0,	listeners: {
			    			check: function(fld, newVal, oldVal) {
								that.btn_status();
							}
			    		}},
			    		{boxLabel: 'スライド',		name: 'paneltype',	inputValue:4},
			    		{boxLabel: '折線グラフ',		name: 'paneltype',	inputValue:1},
			    		{boxLabel: '棒グラフ',		name: 'paneltype',	inputValue:2},
			    		{boxLabel: '円グラフ',		name: 'paneltype',	inputValue:3}
					]
				}, {
					itemId:		'edittype',
					name:		'edittype',
 	                xtype:		'radiogroup',
	                fieldLabel:	'入力形式',
	                columns:	3,
	                width:		300,
                    items: [
			    		{boxLabel: 'なし',			name:'edittype',	inputValue:0,	id:'edittype0'},
			    		{boxLabel: '直接編集',		name:'edittype',	inputValue:1,	id:'edittype1'},
			    		{boxLabel: '横フォーム',		name:'edittype',	inputValue:2,	id:'edittype2'},
			    		{boxLabel: 'ウィンドウ',		name:'edittype',	inputValue:3,	id:'edittype3'}
                    ]
                }, {
					itemId:		'filtertype',
					name:		'filtertype',
 	                xtype:		'radiogroup',
	                fieldLabel:	'フィルター',
	                width:		300,
                    items: [
			    		{boxLabel: 'なし',			name:'filtertype',	inputValue:0},
			    		{boxLabel: '月次',			name:'filtertype',	inputValue:1},
			    		{boxLabel: '選択項目',		name:'filtertype',	inputValue:2}
                    ]
	            },
		    	{name: 'remark',	fieldLabel: '備考',		xtype: 'textarea', allowBlank: true}
			]
		});

		var hdls = {
			update: function(btn, evt) {
				var form = that.get('form').getForm();

				if (!form.isValid()) {
					Ext.Msg.alert('エラー', '入力内容に誤りがあります。もう一度、確認してください。');
					return false;
				}

//				form.updateRecord(that.rec);
				var vals = form.getValues();
				that.rec.set('title',		vals.title);
				that.rec.set('paneltype',	vals.paneltype);
				that.rec.set('edittype',	vals.edittype);
				that.rec.set('filtertype',	vals.filtertype);
				that.rec.set('remark',		vals.remark);

		        that.hide();
			},
			cancel: function(btn, evt) {
	            that.hide();
			}
		};

		var config = {
			title:			'パネル編集',
		    layout:			'fit',
		    width:			460,
		    height:			440,
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
		Dgn.PanelWin.superclass.initComponent.call(this);
	},
	setupForm: function(rec) {
		var that = this;

		var form = this.get('form');
		this.rec = rec;
		form.getForm().loadRecord(rec);
		form.get('paneltype').setValue('paneltype', rec.get('paneltype'));
		form.get('edittype').setValue('edittype', rec.get('edittype'));
		form.get('filtertype').setValue('filtertype', rec.get('filtertype'));
		
		var store		= getStore('File');
		var index		= store.find('_id', rec.get('file_id'));
		var fileName	= store.getAt(index).get('name');
		form.getForm().findField('file_name').setValue(fileName);
//		this.btn_status();
	},
	btn_status: function() {
		var that = this;

		var form = this.get('form').getForm();
		var vals = form.getValues();

		if (vals.paneltype > 0) {
			getCmp('edittype0').setValue(0);
			getCmp('edittype1').setDisabled(true);
			getCmp('edittype2').setDisabled(true);
			getCmp('edittype3').setDisabled(true);
		} else {
			getCmp('edittype1').setDisabled(false);
			getCmp('edittype2').setDisabled(false);
			getCmp('edittype3').setDisabled(false);
		}
	}
});
