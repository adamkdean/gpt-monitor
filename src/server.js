// Copyright (C) 2023 Adam K Dean <adamkdean@googlemail.com>
// Use of this source code is governed by the GPL-3.0
// license that can be found in the LICENSE file.

import express from 'express'
import path from 'path'
import { Monitor } from './lib/monitor.js'
import config from './config.js'

const monitor = new Monitor(config)

const app = express()
app.disable('x-powered-by')
app.set('view engine', 'ejs')
app.set('views', path.join(path.resolve(), 'src', 'views'))
app.use(express.static(path.join(path.resolve(), 'src', 'public')))

app.get('/', async (req, res) => {
  res.render('index')
})

app.listen(config.server.port, async () => {
  console.log(`Server listening on port ${config.server.port}`)
  await monitor.initialize()
})