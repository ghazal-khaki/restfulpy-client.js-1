import { encodeQueryString } from './helpers'
import { BaseException } from './exceptions'

export default function doHttpRequest (url, options, responseFactory) {
  let defaultOptions = {
    payload: null,
    verb: 'get',
    headers: {},
    encoding: 'json',
    postProcessor: null,
    xhrWithCredentials: true,
    errorHandlers: {},
    onResponse: null
  }
  Object.assign(defaultOptions, options)

  return new Promise((resolve, reject) => {
    let xhr = new window.XMLHttpRequest()
    let requestBody = ''

    xhr.onload = () => {
      let response = responseFactory(xhr)

      // This is for handling JSON Patch requests

      if (Array.isArray(response)) {
        if (response[0].status === 200) {
          if (defaultOptions.onResponse) {
            defaultOptions.onResponse(response[0])
          }
          resolve(response)
        } else if (defaultOptions.errorHandlers[response[0].status]) {
          defaultOptions.errorHandlers[response[0].status](
            response[0],
            window.location.href
          )
          reject(response)
        } else {
          reject(response)
        }
      } else {
        if (response.status === 200) {
          if (defaultOptions.onResponse) {
            console.log(response.status, 'Im here in onResponse')
            defaultOptions.onResponse(response)
          }
          if (defaultOptions.postProcessor) {
            defaultOptions.postProcessor(response, resolve)
          } else {
            resolve(response)
          }
        } else if (defaultOptions.errorHandlers[response.status]) {
          defaultOptions.errorHandlers[response.status](
            response,
            window.location.href
          )
          reject(response)
        } else {
          reject(response)
        }
      }
    }
    xhr.onerror = () => {
      reject(responseFactory(xhr))
    }
    xhr.open(defaultOptions.verb.toUpperCase(), url)

    for (let header in defaultOptions.headers) {
      xhr.setRequestHeader(header, defaultOptions.headers[header])
    }

    if (defaultOptions.encoding === null) {
      requestBody = null
    } else if (defaultOptions.encoding === 'json') {
      if (
        defaultOptions.payload &&
        Object.keys(defaultOptions.payload).length
      ) {
        requestBody = JSON.stringify(defaultOptions.payload)
        xhr.setRequestHeader('Content-Type', 'application/json;charset=UTF-8')
      } else {
        requestBody = null
      }
    } else if (defaultOptions.encoding === 'urlencoded') {
      requestBody = encodeQueryString(defaultOptions.payload)
      xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded')
    } else if (defaultOptions.encoding === 'multipart') {
      requestBody = new window.FormData()
      for (let paramName in defaultOptions.payload) {
        let value = defaultOptions.payload[paramName]
        if (value instanceof window.File) {
          requestBody.append(paramName, value, value.name)
        } else if (value instanceof Array) {
          for (let file of value) {
            requestBody.append(paramName, file, file.name)
          }
        } else {
          requestBody.append(paramName, value)
        }
      }
      // Do not setting the content type for multipart
      // xhr.setRequestHeader('Content-Type', 'multipart/form-data')
    } else {
      throw new BaseException(
        `encoding: ${defaultOptions.encoding} is not supported.`
      )
    }
    xhr.withCredentials = defaultOptions.xhrWithCredentials
    xhr.send(requestBody)
  })
}
