import { check, group, sleep } from 'k6'
import http from 'k6/http'

export const options = {
  cloud: {
    distribution: { 'amazon:us:ashburn': { loadZone: 'amazon:us:ashburn', percent: 100 } },
    apm: [],
  },
  thresholds: {},
  scenarios: {
    Scenario_1: {
      executor: 'ramping-vus',
      gracefulStop: '30s',
      stages: [
        { target: 20, duration: '15s' },
        { target: 50, duration: '30s' },
        { target: 5, duration: '15s' },
        { target: 0, duration: '15s' },
      ],
      gracefulRampDown: '30s',
      exec: 'scenario_1',
    },
  },
}

export function scenario_1() {
  let response

  group('Login and order - https://pizza.tychart.com/', function () {
    response = http.get('https://pizza.tychart.com/', {
      headers: {
        Host: 'pizza.tychart.com',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br, zstd',
      },
    })
    sleep(3)

    // Login
    response = http.put(
      'https://pizza-service.tychart.com/api/auth',
      '{"email":"test@test.com","password":"test"}',
      {
        headers: {
          Host: 'pizza-service.tychart.com',
          Accept: '*/*',
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept-Encoding': 'gzip, deflate, br, zstd',
          'Content-Type': 'application/json',
          Origin: 'https://pizza.tychart.com',
        },
      }
    )
    check(response, { 'status equals 200': response => response.status.toString() === '200' })

    // Store the token from the response
    const token = response.json('token')
    
    sleep(3)

    // Menu
    response = http.get('https://pizza-service.tychart.com/api/order/menu', {
      headers: {
        Host: 'pizza-service.tychart.com',
        Accept: '*/*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br, zstd',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        Origin: 'https://pizza.tychart.com',
      },
    })

    // Franchise List
    response = http.get('https://pizza-service.tychart.com/api/franchise?page=0&limit=20&name=*', {
      headers: {
        Host: 'pizza-service.tychart.com',
        Accept: '*/*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br, zstd',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        Origin: 'https://pizza.tychart.com',
      },
    })
    sleep(3)

    // Get my profile
    response = http.get('https://pizza-service.tychart.com/api/user/me', {
      headers: {
        Host: 'pizza-service.tychart.com',
        Accept: '*/*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br, zstd',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        Origin: 'https://pizza.tychart.com',
      },
    })
    sleep(3)

    // Buy the pizza
    response = http.post(
      'https://pizza-service.tychart.com/api/order',
      '{"items":[{"menuId":5,"description":"Charred Leopard","price":0.0099}],"storeId":"1","franchiseId":1}',
      {
        headers: {
          Host: 'pizza-service.tychart.com',
          Accept: '*/*',
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept-Encoding': 'gzip, deflate, br, zstd',
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          Origin: 'https://pizza.tychart.com',
        },
      }
    )
    sleep(3)


    const jwt_body = {
      jwt: response.json('jwt')
    }

    console.log(jwt_body)

    // Verify the pizza is correct
    response = http.post('https://pizza-factory.cs329.click/api/order/verify', JSON.stringify(jwt_body),
      {
        headers: {
          Host: 'pizza-factory.cs329.click',
          Accept: '*/*',
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept-Encoding': 'gzip, deflate, br, zstd',
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          Origin: 'https://pizza.tychart.com',
          'Sec-Fetch-Storage-Access': 'none',
        },
      }
    )
  })
}
