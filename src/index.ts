import express from 'express'
import { json } from 'body-parser'
import cors from 'cors'
import { getChallenge, verifyEthSignature } from 'etherpass'

import { createApolloServer } from './graphql'
import { getTokenForAddress } from './auth'

import { connect } from './db/connect'
import { connectNetwork } from './network/connect'

const startServer = async () => {
  const { db } = await connect() // we can also close the client from here
  const network = await connectNetwork()
  const apolloServer = createApolloServer(db, network)

  const app = express()
  const port = 3000

  app.use(cors())
  app.use(json())

  app.post('/auth/challenge', (req, res) => {
    console.log(req.body)
    // TODO: validation
    const challenge = getChallenge(req.body.address)
    return res.json({ challenge })
  })

  app.post('/auth/token', (req, res) => {
    // TODO: validationx
    const address = verifyEthSignature(req.body.challenge, req.body.signature)
    const token = getTokenForAddress(address)
    return res.json({ token, address })
  })

  apolloServer.applyMiddleware({ app })

  app.listen(port, () => {
    console.log(`Started on port ${port}`)
    console.log(
      `GraphQL at http://localhost:${port}${apolloServer.graphqlPath}`,
    )
  })
}

startServer()
  .then(() => console.info('Server started successfully'))
  .catch(error => console.error(error))
