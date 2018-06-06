/*
	Logfella OSD Transport

	Copyright (c) 2015 - 2018 Cédric Ronvel

	The MIT License (MIT)

	Permission is hereby granted, free of charge, to any person obtaining a copy
	of this software and associated documentation files (the "Software"), to deal
	in the Software without restriction, including without limitation the rights
	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
	copies of the Software, and to permit persons to whom the Software is
	furnished to do so, subject to the following conditions:

	The above copyright notice and this permission notice shall be included in all
	copies or substantial portions of the Software.

	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
	SOFTWARE.
*/

"use strict" ;



var CommonTransport = require( 'logfella-common-transport' ) ;
var Promise = require( 'seventh' ) ;



var nodeNotifier , freedesktopNotifications ;
var platform = require( 'os' ).platform() ;
var exitCleanup ;



switch ( platform ) {
	case 'linux' :
		try {
			freedesktopNotifications = require( 'freedesktop-notifications' ) ;
			freedesktopNotifications.setUnflood( 300 ) ;

			exitCleanup = function() {
				freedesktopNotifications.purge() ;
			} ;

			process.on( 'asyncExit' , exitCleanup ) ;
			process.on( 'exit' , exitCleanup ) ;
		}
		catch ( error ) {
			nodeNotifier = require( 'node-notifier' ) ;
		}
		break ;
	default :
		nodeNotifier = require( 'node-notifier' ) ;
}



function OsdTransport( logger , config = {} ) {
	CommonTransport.call( this , logger , config ) ;

	this.color = false ;
	this.indent = false ;
	this.includeIdMeta = !! config.includeIdMeta ;
	this.includeCommonMeta = config.includeCommonMeta === undefined ? true : !! config.includeCommonMeta ;
	this.includeUserMeta = config.includeUserMeta === undefined ? true : !! config.includeUserMeta ;
}

module.exports = OsdTransport ;

OsdTransport.prototype = Object.create( CommonTransport.prototype ) ;
OsdTransport.prototype.constructor = OsdTransport ;



OsdTransport.prototype.transport = function transport( data , cache ) {
	return new Promise( resolve => {
		this.notify( {
			title: data.app + ' ' + data.levelName + ' (' + data.domain + ')' ,
			message: this.messageFormatter( data , cache ) ,
			urgency: data.level >= 5 ? 'critical' : 'normal'
		} , resolve ) ;
	} ) ;
} ;



var iconPath = __dirname + '/../icons/log.png' ;
var soundPath = __dirname + '/../sounds/spear.wav' ;



OsdTransport.prototype.notify = function notify( data , callback ) {
	if ( freedesktopNotifications ) {
		freedesktopNotifications.createNotification( {
			summary: data.title ,
			body: data.message ,
			urgency: data.urgency ,
			icon: iconPath ,
			sound: soundPath
		} ).push( callback ) ;
	}
	else if ( nodeNotifier ) {
		nodeNotifier.notify( {
			title: data.title ,
			message: data.message ,
			urgency: data.urgency ,
			icon: iconPath
		} , () => { callback() ; } ) ;
	}
} ;

