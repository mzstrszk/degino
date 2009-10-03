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
// 登録ウィンドウ管理
// ************************
Dgn.registman = {
	init: function() {
		var that = this;

		var vld_password = function(value) {
			if (value == getCmp('password').getValue()) {
				return true;
			}
	
			return 'パスワードが一致しません。';
		};
	
		var hdls = {
			regist: function(btn, evt) {
				that.regist();
			},
			cancel: function(btn, evt) {
				that.win.hide();
			}
		};

		this.form = new Ext.form.FormPanel({
			frame:		true,
			defaults:	{
				xtype:		'textfield',
				allowBlank:	false
			},
			items:		[
				{name:'nickname',		fieldLabel:'ニックネーム',		maxLength: 100},
				{name:'mail',			fieldLabel:'メールアドレス',	maxLength: 100,	validator:Dgn.util.vld_mail},
				{name:'password',		fieldLabel:'パスワード',		maxLength: 100,	inputType:'password', id:'password'},
				{name:'conformation',	fieldLabel:'パスワード(確認)',	inputType:'password',	validator:vld_password},
				{name:'birthday',		fieldLabel:'生年月日',		xtype:'datefield',		allowBlank:true,	format:'Y.n.j',
				 minValue: new Date(1900, 0, 1), maxValue: new Date()},
				{id:'msg2',				xtype:'panel',		html:'<br />入力内容に誤りがあります。もう一度、確認してください。', hidden:true, style:'color:red;'}
			]
		});

	  	this.win = new Ext.Window({
	        title:			'ユーザー登録',
	        layout:			'fit',
	        width:			400,
	        height:			280,
	        closeAction:	'hide',
	        plain:			false,
	        items:			[this.form],
			buttons:	[
				{text:'ユーザー登録',	handler:hdls.regist,　type:'submit'},
				{text:'キャンセル',	handler:hdls.cancel}
			]
	    });
	},
	regist: function(btn, evt) {
		var that = this;

		var form	= this.form.getForm();
	
		getCmp('msg2').hide();
		if (!form.isValid()) {
			getCmp('msg2').show();
			return false;
		}
	
		var vals	= form.getValues();
		var	sha1	= CybozuLabs.SHA1.calc(vals.mail + vals.password);
		var params	= {_MSG:'_REGIST', basehash:sha1};
		Ext.apply(params, vals);
	
		var success = function(res, opt) {
	 		var msgs = {
	 			m1:	'ユーザー登録を受け付けました。<br />数分以内に届くメールをご確認いただき、登録手続きを完了してください。',
	 			m2:	'既にユーザー登録されています。'
	 		};
	 		var ret	= Ext.util.JSON.decode(res.responseText);
			var msg = ret.success ? msgs.m1 : msgs.m2;
	
			that.win.hide();
			Ext.Msg.alert('ユーザー登録', msg);
		};
	
		Ext.Ajax.request({
			method:		'POST',
			url:		'/Auth',
			params:		params,
			success:	success,
			failure:	failure_dialogue
		});
	}
};
