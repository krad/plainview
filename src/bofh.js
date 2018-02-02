/**
 * @file bofh - Bastard Operator from Hell.  Async HLS fetcher thing.
 * @author krad.io <iam@krad.io>
 * @version 0.0.2
 */

 var get = function(url, response) {
   console.log(url, response)
 }

 function BOFH(constructor) {
   if (constructor) { this.requestConstructor = constructor }
   else { this.requestConstructor = XMLHttpRequest }
 }

 BOFH.prototype.get = function(url, callback) {
   var client = new this.requestConstructor
   client.open('get', url)
   client.responseType = 'arraybuffer'
   client.onload = function() { callback(client.response) }
   client.send()
 }

 module.exports = {
   BOFH: BOFH
 }
