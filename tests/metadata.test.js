/**
 * Created by vahid on 7/14/17.
 */

import { MockupClient } from './helpers'
import Field from '../src/field'

describe('Metadata', function() {
  it('Loading metadata', function(done) {
    let c = new MockupClient()
    c.loadMetadata({ entities: { Resource: { url: 'resources' } } })
      .then(resps => {
        expect(
          c.metadata.models.Resource.fields.title instanceof Field
        ).toBeTruthy()
        done()
      })
      .catch(done.fail)
  })

  it('Including protected field', function(done) {
    let c = new MockupClient()
    c.loadMetadata({ entities: { Resource: { url: 'resources' } } })
      .then(resps => {
        expect(
          c.metadata.models.Resource.fields.password.protected
        ).toBeTruthy()
        done()
      })
      .catch(done.fail)
  })
})
