const assert = require('chai').assert
const expect = require('chai').expect
const request = require('supertest')


describe("Refund API's", () => {
    it('responds with json', function (done) {
        request('http://localhost:3000').post('/refund_1')
            .send({
                "order_id": 219843263,
                "amount": "0.01",
                "reason": "Payment made with wrong currency",
                "host": "1337.t2scdn.com",
                "merchant_id": 11111111
            })
            .set('Content-Type', 'application/json')
            .expect('Content-Type', /json/)
            .expect(403)
            .end((err, respose) => {
                if (err) return done(err);
                console.log(err)
                done();
            })
    })
})