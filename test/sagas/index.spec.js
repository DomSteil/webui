import {expect} from 'chai'
import {put, take, fork, call, race, select} from 'redux-saga/effects'

import * as actions from '../../app/scripts/actions'
import {
  fetchId,
  loadId,
  fetchPeerIds,
  fetchPeerDetails,
  fetchPeerLocations,
  watchPeers,
  watchLogs,
  watchLoadHomePage,
  watchLoadLogsPage,
  watchNavigate
} from '../../app/scripts/sagas'
import {api, history} from '../../app/scripts/services'
import {delay} from '../../app/scripts/utils/promise'

describe('sagas', () => {
  describe('fetchId', () => {
    it('success', () => {
      const generator = fetchId()

      let next = generator.next()
      expect(next.value).to.be.eql(put(actions.id.request()))

      next = generator.next()
      expect(next.value).to.be.eql(call(api.id))

      next = generator.next('hello')
      expect(next.value).to.be.eql(put(actions.id.success('hello')))
    })

    it('failure', () => {
      const generator = fetchId()

      let next = generator.next()
      expect(next.value).to.be.eql(put(actions.id.request()))

      next = generator.next()
      expect(next.value).to.be.eql(call(api.id))

      next = generator.throw(new Error('error'))
      expect(next.value).to.be.eql(put(actions.id.failure('error')))
    })
  })

  it('loadId', () => {
    const generator = loadId()

    let next = generator.next()
    expect(next.value).to.be.eql(call(fetchId))
  })

  describe('fetchPeerIds', () => {
    it('success', () => {
      const state = {
        peers: {
          ids: [{id: 1}, {id: 2}],
          locations: {1: {id: 1, val: 'hello'}}
        }
      }
      const generator = fetchPeerIds()

      let next = generator.next()
      expect(next.value).to.be.eql(put(actions.peerIds.request()))

      next = generator.next()
      expect(next.value).to.be.eql(call(api.peerIds))

      next = generator.next([{id: 3}])
      expect(next.value).to.be.eql(put(actions.peerIds.success([{id: 3}])))

      next = generator.next()
      expect(next.value).to.be.eql(select())

      next = generator.next(state)
      expect(next.value).to.be.eql(fork(fetchPeerDetails, [{id: 3}]))

      next = generator.next()
      expect(
        next.value
      ).to.be.eql(fork(fetchPeerLocations, [{id: 3}]))
    })

    it('failure', () => {
      const generator = fetchPeerIds()

      let next = generator.next()
      expect(next.value).to.be.eql(put(actions.peerIds.request()))

      next = generator.next()
      expect(next.value).to.be.eql(call(api.peerIds))

      next = generator.throw(new Error('error'))
      expect(next.value).to.be.eql(put(actions.peerIds.failure('error')))
    })
  })

  describe('fetchPeerDetails', () => {
    it('success', () => {
      const state = {
        peers: {
          ids: [{id: 1}, {id: 2}],
          details: {1: {id: 1, val: 'hello'}}
        }
      }
      const generator = fetchPeerDetails([{id: 2}])

      let next = generator.next()
      expect(next.value).to.be.eql(put(actions.peerDetails.request()))

      next = generator.next()
      expect(next.value).to.be.eql(call(api.peerDetails, [{id: 2}]))

      next = generator.next({2: {id: 2, val: 'world'}})
      expect(next.value).to.be.eql(select())

      next = generator.next(state)
      expect(next.value).to.be.eql(put(actions.peerDetails.success({
        1: {id: 1, val: 'hello'},
        2: {id: 2, val: 'world'}
      })))
    })

    it('failure', () => {
      const generator = fetchPeerDetails([])

      let next = generator.next()
      expect(next.value).to.be.eql(put(actions.peerDetails.request()))

      next = generator.next()
      expect(next.value).to.be.eql(call(api.peerDetails, []))

      next = generator.throw(new Error('error'))
      expect(next.value).to.be.eql(put(actions.peerDetails.failure('error')))
    })
  })

  describe('fetchPeerLocations', () => {
    it('success', () => {
      const state = {
        peers: {
          ids: [{id: 1}, {id: 2}],
          locations: {1: {id: 1, val: 'hello'}}
        }
      }
      const generator = fetchPeerLocations([{id: 2}])

      let next = generator.next()
      expect(next.value).to.be.eql(put(actions.peerLocations.request()))

      next = generator.next()
      expect(next.value).to.be.eql(call(api.peerLocations, [{id: 2}]))

      next = generator.next({2: {id: 2, val: 'world'}})
      expect(next.value).to.be.eql(select())

      next = generator.next(state)
      expect(next.value).to.be.eql(put(actions.peerLocations.success({
        1: {id: 1, val: 'hello'},
        2: {id: 2, val: 'world'}
      })))
    })

    it('failure', () => {
      const generator = fetchPeerLocations([])

      let next = generator.next()
      expect(next.value).to.be.eql(put(actions.peerLocations.request()))

      next = generator.next()
      expect(next.value).to.be.eql(call(api.peerLocations, []))

      next = generator.throw(new Error('error'))
      expect(next.value).to.be.eql(put(actions.peerLocations.failure('error')))
    })
  })

  it('watchPeers', () => {
    const generator = watchPeers()
    const racer = race({
      delay: call(delay, 5000),
      cancel: take(actions.LEAVE_PEERS_PAGE)
    })

    let next = generator.next({})
    expect(next.value).to.be.eql(call(fetchPeerIds))

    next = generator.next()
    expect(next.value).to.be.eql(racer)

    next = generator.next({})
    expect(next.value).to.be.eql(call(fetchPeerIds))

    next = generator.next()
    expect(next.value).to.be.eql(racer)

    next = generator.next({})
    expect(next.value).to.be.eql(call(fetchPeerIds))

    next = generator.next()
    expect(next.value).to.be.eql(racer)

    next = generator.next({cancel: true})
    expect(next.value).to.be.eql(put(actions.peers.cancel()))
  })

  it('watchLogs', () => {
    const source = {
      getNext () {
        return 1
      }
    }
    const generator = watchLogs(source)
    const racer = race({
      data: call(source.getNext),
      cancel: take(actions.LEAVE_LOGS_PAGE)
    })

    let next = generator.next()
    expect(next.value).to.be.eql(racer)

    next = generator.next({data: 'log'})
    expect(next.value).to.be.eql(put(actions.logs.receive('log')))

    next = generator.next()
    expect(next.value).to.be.eql(racer)

    next = generator.next({data: 'log2'})
    expect(next.value).to.be.eql(put(actions.logs.receive('log2')))

    next = generator.next()
    expect(next.value).to.be.eql(racer)

    next = generator.next({cancel: true})
    expect(next.value).to.be.eql(put(actions.logs.cancel()))
  })

  it('watchLoadHomePage', () => {
    const generator = watchLoadHomePage()

    let next = generator.next()
    expect(next.value).to.be.eql(take(actions.LOAD_HOME_PAGE))

    next = generator.next()
    expect(next.value).to.be.eql(fork(loadId))
  })

  it('watchLoadLogsPage', () => {
    const generator = watchLoadLogsPage()

    let next = generator.next()
    expect(next.value)
      .to.be.eql(take(actions.LOAD_LOGS_PAGE))

    next = generator.next('source')
    expect(next.value)
      .to.be.eql(call(api.createLogSource))

    next = generator.next('source')
    expect(next.value)
      .to.be.eql(fork(watchLogs, 'source'))
  })

  it('watchNavigate', () => {
    const generator = watchNavigate()

    let next = generator.next()
    expect(next.value).to.be.eql(take(actions.NAVIGATE))

    next = generator.next({pathname: '/hello'})
    expect(next.value).to.be.eql(history.push('/hello'))
  })
})
