'use strict' //Enables strict mode is JavaScript
let gc_region = getParameterByName('gc_region')
let gc_clientId = getParameterByName('gc_clientId')
let gc_redirectUrl = getParameterByName('gc_redirectUrl')

//Getting and setting the GC details from dynamic URL and session storage
gc_region ? sessionStorage.setItem('gc_region', gc_region) : (gc_region = sessionStorage.getItem('gc_region'))
gc_clientId ? sessionStorage.setItem('gc_clientId', gc_clientId) : (gc_clientId = sessionStorage.getItem('gc_clientId'))
gc_redirectUrl ? sessionStorage.setItem('gc_redirectUrl', gc_redirectUrl) : (gc_redirectUrl = sessionStorage.getItem('gc_redirectUrl'))

let platformClient = require('platformClient')
const client = platformClient.ApiClient.instance
const uapi = new platformClient.UsersApi()
const capi = new platformClient.ConversationsApi()
let chartData = {
  values: [
    { category: 'Voice', value: 0 },
    { category: 'Callback', value: 0 },
    { category: 'Email', value: 0 },
    { category: 'Message', value: 0 },
    { category: 'Chat', value: 0 },
  ],
}

async function start() {
  try {
    client.setEnvironment(gc_region)
    client.setPersistSettings(true, '_mm_')

    console.log('%cLogging in to Genesys Cloud', 'color: green')
    await client.loginImplicitGrant(gc_clientId, gc_redirectUrl, {})

    //Enter in starting code.
    thismonth()
    dataLakeDate()
  } catch (err) {
    console.log('Error: ', err)
  }
} //End of start() function

//JavaScript Native way to get Url Parameters for config
function getParameterByName(name, url) {
  if (!url) url = window.location.href
  name = name.replace(/[\[\]]/g, '$&')
  var regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)'),
    results = regex.exec(url)
  if (!results) return null
  if (!results[2]) return ''
  return decodeURIComponent(results[2].replace(/\+/g, ' '))
}

function last30days() {
  let today = new Date()
  let amonthago = new Date()
  amonthago.setMonth(amonthago.getMonth() - 1)
  document.getElementById('datepicker').value = `${amonthago.getFullYear()}-${String(amonthago.getMonth() + 1).padStart(2, '0')}-${String(amonthago.getDate()).padStart(
    2,
    '0'
  )}/${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
}

function thismonth() {
  let today = new Date()
  document.getElementById('datepicker').value = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01/${today.getFullYear()}-${String(today.getMonth() + 1).padStart(
    2,
    '0'
  )}-${String(today.getDate()).padStart(2, '0')}`
}

async function dataLakeDate() {
  let dataLake = await capi.getAnalyticsConversationsDetailsJobsAvailability()
  console.log(dataLake)
  let localDate = new Date(dataLake.dataAvailabilityDate)
  console.log(localDate)
  document.getElementById('datalake').innerHTML = localDate
}

async function removerows() {
  document.getElementById('tablebody').innerHTML = ''
  document.getElementById('filters').hidden = true
}

async function addChart(category) {
  // const chart = document.querySelector('#chart')
  category.includes('voice') ? chartData.values[0].value++ : null
  category.includes('callback') ? chartData.values[1].value++ : null
  category.includes('email') ? chartData.values[2].value++ : null
  category.includes('message') ? chartData.values[3].value++ : null
  category.includes('chat') ? chartData.values[4].value++ : null
  // chart.chartData = chartData
}

async function displayChart() {
  if (document.getElementById('chart')) document.getElementById('chart').remove()
  let chart = document.createElement('gux-chart-donut-beta')
  let div = document.getElementById('donut')
  chart.id = 'chart'
  chart.setAttribute('label-radius', '110')
  chart.setAttribute('label-field', 'value')
  chart.setAttribute('include-legend', 'true')
  chart.setAttribute('legend-title', 'MediaType')
  chart.setAttribute('outer-radius', '100')

  chart.chartData = chartData

  const tooltipOptions = {
    theme: 'custom',
    // Make sure to sanitize user data to prevent XSS
    formatTooltip: (tool, sanitize) => {
      return `<div><b>${sanitize(tool.category)}</b>: ${sanitize(tool.value)}</div>`
    },
  }

  chart.tooltipOptions = tooltipOptions

  div.appendChild(chart)
  console.log('added chart')
}

async function addrow(id, inMedia, inDirection, inFrom, inUser, inNote, inAttribute) {
  let table = document.getElementById('tablebody')
  let row = document.createElement('tr')
  let action = document.createElement('td')
  let media = document.createElement('td')
  let direction = document.createElement('td')
  let from = document.createElement('td')
  let user = document.createElement('td')
  let note = document.createElement('td')
  let attribute = document.createElement('td')

  row.id = id
  action.innerHTML = `<gux-button id="${id}">Open</gux-button>`
  media.innerHTML = inMedia
  direction.innerHTML = inDirection
  from.innerHTML = inFrom
  user.innerHTML = inUser
  note.innerHTML = inNote
  attribute.innerHTML = inAttribute

  row.appendChild(action)
  row.appendChild(media)
  row.appendChild(direction)
  row.appendChild(from)
  row.appendChild(user)
  row.appendChild(note)
  row.appendChild(attribute)

  table.appendChild(row)
  addChart(inMedia)
}

async function createjob() {
  removerows()
  document.getElementById('loading').style = 'display: block; margin-left: 47%;'

  let data = await capi.postAnalyticsConversationsDetailsJobs({
    //interval: "2022-12-11T13:00:00.000Z/2022-12-15T13:00:00.000Z",
    interval: `${document.getElementById('datepicker').value.split('/')[0]}T13:00:00.000Z/${document.getElementById('datepicker').value.split('/')[1]}T13:00:00.000Z`,
    order: 'asc',
    orderBy: 'conversationStart',
    paging: {
      pageSize: 25,
      pageNumber: 1,
    },
    segmentFilters: [
      {
        type: 'and',
        predicates: [
          {
            type: 'dimension',
            dimension: 'wrapUpNote',
            operator: 'exists',
            value: null,
          },
        ],
      },
    ],
  })

  console.log(data.jobId)
  checkjob(data.jobId)
}

async function checkjob(jobId) {
  var interval = null
  var name = async function () {
    let job = await capi.getAnalyticsConversationsDetailsJob(jobId)
    console.log(job)
    if (job.state == 'FULFILLED') {
      console.log('Job Fulfilled')
      clearInterval(interval)
      getjob(jobId)
    }
  }
  interval = setInterval(name, 2000)
}

async function getjob(jobId) {
  let job = await capi.getAnalyticsConversationsDetailsJobResults(jobId, {})
  console.log(job)

  document.getElementById('loading').style = 'display: none; margin-left: 47%;'

  for (const conversation of job.conversations) {
    const count = conversation.participants.filter((obj) => {
      if (obj.participantId) {
        return true
      }
      return false
    }).length
    if (count > 1) {
      document.getElementById('filters').hidden = false
      let conversationId = conversation.conversationId
      let note = ''
      let media = ''
      let from = ''
      let user = ''
      let direction = ''
      let attribute = ''
      for (const participant of conversation.participants) {
        if (participant.purpose == 'agent') {
          for (const session of participant.sessions) {
            for (const segment of session.segments) {
              if (segment.segmentType == 'wrapup') {
                if (note != '') note = note + '<br>' + segment.wrapUpNote
                if (note == '') note = segment.wrapUpNote

                if (user != '') user = user + '<br>' + participant.userId
                if (user == '') user = participant.userId

                if (from != '') from = from + '<br>' + session.remote
                if (from == '') from = session.remote

                if (media != '') media = media + '<br>' + session.mediaType
                if (media == '') media = session.mediaType

                if (direction != '') direction = direction + '<br>' + session.direction
                if (direction == '') direction = session.direction
              }
            }
          }
        }
        if (participant.purpose == 'customer') {
          if (attribute != '') attribute = attribute + '<br>' + JSON.stringify(participant.attributes)
          if (attribute == '') attribute = JSON.stringify(participant.attributes)
        }
      }
      console.log(`Row: ${conversationId} , ${media} , ${direction} , ${from} , ${user} , ${attribute}, ${note}`)
      addrow(conversationId, media, direction, from, user, note, attribute)
    }
  }
  console.log('build chart...')
  displayChart()
}

async function filter() {
  let text = document.getElementById('inputNotes').value
  let attribute = document.getElementById('inputAttributes').value
  console.log(`Filter for: NOTE:${text} ATTRIBUTES:${attribute}`)

  let call = document.getElementById('Call').checked
  let callback = document.getElementById('Callback').checked
  let email = document.getElementById('Email').checked
  let message = document.getElementById('Message').checked
  let chat = document.getElementById('Chat').checked

  chartData = {
    values: [
      { category: 'Voice', value: 0 },
      { category: 'Callback', value: 0 },
      { category: 'Email', value: 0 },
      { category: 'Message', value: 0 },
      { category: 'Chat', value: 0 },
    ],
  }

  Array.from(document.getElementById('tablebody').children).forEach(function (row) {
    if (row.children[5].innerHTML.includes(text) && row.children[6].innerHTML.includes(attribute) && call && row.children[1].innerHTML.includes('voice')) {
      console.log(`voice: ${row.id}`)
      console.log(row.children[4].innerHTML)
      row.hidden = false
      addChart('voice')
      return
    }
    if (row.children[5].innerHTML.includes(text) && row.children[6].innerHTML.includes(attribute) && callback && row.children[1].innerHTML.includes('callback')) {
      console.log(`callback: ${row.id}`)
      console.log(row.children[4].innerHTML)
      row.hidden = false
      addChart('callback')
      return
    }
    if (row.children[5].innerHTML.includes(text) && row.children[6].innerHTML.includes(attribute) && email && row.children[1].innerHTML.includes('email')) {
      console.log(`email: ${row.id}`)
      console.log(row.children[4].innerHTML)
      row.hidden = false
      addChart('email')
      return
    }
    if (row.children[5].innerHTML.includes(text) && row.children[6].innerHTML.includes(attribute) && message && row.children[1].innerHTML.includes('message')) {
      console.log(`message: ${row.id}`)
      console.log(row.children[4].innerHTML)
      row.hidden = false
      addChart('message')
      return
    }
    if (row.children[5].innerHTML.includes(text) && row.children[6].innerHTML.includes(attribute) && chat && row.children[1].innerHTML.includes('chat')) {
      console.log(`chat: ${row.id}`)
      console.log(row.children[4].innerHTML)
      row.hidden = false
      addChart('chat')
      return
    } else {
      row.hidden = true
    }
  })
  console.log('filter done')
  displayChart()
}
