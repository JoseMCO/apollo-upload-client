'use strict'

var _require = require('apollo-link'),
  ApolloLink = _require.ApolloLink,
  Observable = _require.Observable

var _require2 = require('apollo-link-http-common'),
  selectURI = _require2.selectURI,
  selectHttpOptionsAndBody = _require2.selectHttpOptionsAndBody,
  fallbackHttpConfig = _require2.fallbackHttpConfig,
  serializeFetchParameter = _require2.serializeFetchParameter,
  createSignalIfSupported = _require2.createSignalIfSupported,
  parseAndCheckHttpResponse = _require2.parseAndCheckHttpResponse

var _require3 = require('extract-files'),
  extractFiles = _require3.extractFiles,
  ReactNativeFile = _require3.ReactNativeFile

exports.ReactNativeFile = ReactNativeFile

exports.createUploadLink = function(_temp) {
  var _ref = _temp === void 0 ? {} : _temp,
    _ref$uri = _ref.uri,
    fetchUri = _ref$uri === void 0 ? '/graphql' : _ref$uri,
    _ref$fetch = _ref.fetch,
    linkFetch = _ref$fetch === void 0 ? fetch : _ref$fetch,
    fetchOptions = _ref.fetchOptions,
    credentials = _ref.credentials,
    headers = _ref.headers,
    includeExtensions = _ref.includeExtensions

  var linkConfig = {
    http: {
      includeExtensions: includeExtensions
    },
    options: fetchOptions,
    credentials: credentials,
    headers: headers
  }
  return new ApolloLink(function(operation) {
    var uri = selectURI(operation, fetchUri)
    var context = operation.getContext()
    var contextConfig = {
      http: context.http,
      options: context.fetchOptions,
      credentials: context.credentials,
      headers: context.headers
    }

    var _selectHttpOptionsAnd = selectHttpOptionsAndBody(
        operation,
        fallbackHttpConfig,
        linkConfig,
        contextConfig
      ),
      options = _selectHttpOptionsAnd.options,
      body = _selectHttpOptionsAnd.body

    var _extractFiles = extractFiles(body),
      clone = _extractFiles.clone,
      files = _extractFiles.files

    var payload = serializeFetchParameter(clone, 'Payload')

    if (files.size) {
      delete options.headers['content-type']
      var form = new FormData()
      form.append('operations', payload)
      var query = clone.query
      var variables = clone.variables
      form.append('variables', JSON.stringify(variables))
      form.append('query', query)
      var i = 0
      files.forEach(function(paths, file) {
        form.append('binary_' + ++i, file, file.name)
      })
      options.body = form
    } else options.body = payload

    return new Observable(function(observer) {
      var _createSignalIfSuppor = createSignalIfSupported(),
        controller = _createSignalIfSuppor.controller,
        signal = _createSignalIfSuppor.signal

      if (controller) options.signal = signal
      linkFetch(uri, options)
        .then(function(response) {
          operation.setContext({
            response: response
          })
          return response
        })
        .then(parseAndCheckHttpResponse(operation))
        .then(function(result) {
          observer.next(result)
          observer.complete()
        })
        .catch(function(error) {
          if (error.name === 'AbortError') return
          if (error.result && error.result.errors && error.result.data)
            observer.next(error.result)
          observer.error(error)
        })
      return function() {
        if (controller) controller.abort()
      }
    })
  })
}
