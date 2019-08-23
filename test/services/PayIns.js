var expect = require('chai').expect;

var helpers = require('../helpers');
var mangopay = require('../../index');

var api = global.api = new mangopay({
  clientId: 'sdk-unit-tests',
  clientApiKey: 'cqFfFrWfCcb7UadHNxx2C9Lo6Djw8ZduLi7J9USTmu8bhxxpju'
});

describe('PayIns', function () {
    var payIn;
    var john = helpers.data.getUserNatural();

    before(function (done) {
        api.Users.create(john, function () {
            done();
        });
    });

    describe('Card Web', function () {

        before(function (done) {
            helpers.getNewPayInCardWeb(api, john, function (data, response) {
                payIn = data;
                done();
            });
        });

        describe('Create', function () {
            it('should create the PayIn', function () {
                expect(payIn.Id).not.to.be.undefined;
                expect(payIn.PaymentType).to.equal('CARD');
                expect(payIn.ExecutionType).to.equal('WEB');
            });
        });

        describe('Get', function () {
            var getPayIn;
            before(function (done) {
                api.PayIns.get(payIn.Id, function (data, response) {
                    getPayIn = data;
                    done()
                });
            });

            it('should get the PayIn', function () {
                expect(getPayIn.Id).not.to.be.undefined;
                expect(getPayIn.PaymentType).to.equal('CARD');
                expect(getPayIn.ExecutionType).to.equal('WEB');
                expect(getPayIn.Status).to.equal('CREATED');
                expect(getPayIn.ExecutionDate).to.be.null;
                expect(getPayIn.RedirectURL).not.to.be.undefined;
                expect(getPayIn.ReturnURL).not.to.be.undefined;
            });
        });
    });

    describe('Card Direct', function () {
        var payIn;

        before(function (done) {
            helpers.getNewPayInCardDirect(api, john, function (data, response) {
                payIn = data;
                done();
            });
        });

        describe('Create', function () {
            it('should create the PayIn', function () {
                expect(payIn.Id).not.to.be.undefined;
                expect(payIn.PaymentType).to.equal('CARD');
                expect(payIn.ExecutionType).to.equal('DIRECT');
                expect(payIn.AuthorId).to.equal(john.Id);
                expect(payIn.Status).to.equal('SUCCEEDED');
                expect(payIn.Type).to.equal('PAYIN');
                expect(payIn.SecurityInfo.AVSResult).to.equal('NO_CHECK')
            });
        });

        describe('Get', function () {
            var getPayIn;
            before(function (done) {
                api.PayIns.get(payIn.Id, function (data, response) {
                    getPayIn = data;
                    done()
                });
            });

            it('should get the PayIn', function () {
                expect(getPayIn.Id).to.equal(payIn.Id);
                expect(getPayIn.PaymentType).to.equal('CARD');
                expect(getPayIn.ExecutionType).to.equal('DIRECT');
                expect(getPayIn.CardId).not.to.be.null;
            });
        });

        describe('Create Refund', function () {
            var refund;

            before(function (done) {
                helpers.getNewRefundForPayIn(api, john, payIn, function (data, response) {
                    refund = data;
                    done();
                });
            });

            it('should succeed', function () {
                expect(refund.DebitedFunds).to.eql(payIn.DebitedFunds);
                expect(refund.Type).to.equal('PAYOUT');
                expect(refund.Nature).to.equal('REFUND');
            });
        });
    });

    describe('PreAuthorizedDirect', function () {
        var preAuthorization, payIn, wallet;

        before(function (done) {
            helpers.getUserCardPreAuthorization(api, john, function (data, response) {
                preAuthorization = data;

                wallet = {
                    Owners: [john.Id],
                    Currency: 'EUR',
                    Description: 'WALLET IN EUR'
                };

                api.Wallets.create(wallet).then(function () {
                    payIn = {
                        CreditedWalletId: wallet.Id,
                        AuthorId: john.Id,
                        DebitedFunds: {
                            Amount: 10000,
                            Currency: 'EUR'
                        },
                        Fees: {
                            Amount: 0,
                            Currency: 'EUR'
                        },
                        CardId: preAuthorization.CardId,
                        SecureModeReturnURL: 'http://test.com',
                        PaymentType: 'PREAUTHORIZED',
                        ExecutionType: 'DIRECT',
                        PreauthorizationId: preAuthorization.Id
                    };

                    api.PayIns.create(payIn, function (data, response) {
                        done();
                    });
                });
            });
        });

        it('should succeed', function () {
            expect(payIn.Id).not.to.be.undefined;
            expect(payIn.data.AuthorId).to.equal(john.Id);
            expect(payIn.data.PaymentType).to.equal('PREAUTHORIZED');
            expect(payIn.data.ExecutionType).to.equal('DIRECT');
            expect(payIn.data.CardId).not.to.be.null;
            expect(payIn.data.Type).to.equal('PAYIN');
            expect(payIn.data.Status).to.equal('SUCCEEDED');
        });
    });

    describe('BankWireDirect', function () {
        var payIn, wallet;

        before(function (done) {
            wallet = {
                Owners: [john.Id],
                Currency: 'EUR',
                Description: 'WALLET IN EUR'
            };

            api.Wallets.create(wallet).then(function () {
                done();
            });
        });

        describe('Create', function () {
            before(function (done) {
                payIn = {
                    CreditedWalletId: wallet.Id,
                    AuthorId: john.Id,
                    DeclaredDebitedFunds: {
                        Amount: 10000,
                        Currency: 'EUR'
                    },
                    DeclaredFees: {
                        Amount: 0,
                        Currency: 'EUR'
                    },
                    PaymentType: 'BANK_WIRE',
                    ExecutionType: 'DIRECT'
                };

                api.PayIns.create(payIn, function (data, response) {
                    done();
                });
            });

            it('should succeed', function () {
                expect(payIn.Id).not.to.be.undefined;
                expect(payIn.data.AuthorId).to.equal(john.Id);
                expect(payIn.data.PaymentType).to.equal('BANK_WIRE');
                expect(payIn.data.ExecutionType).to.equal('DIRECT');
                expect(payIn.data.Type).to.equal('PAYIN');
                expect(payIn.data.Status).to.equal('CREATED');
            });
        });

        describe('Get', function () {
            var getPayIn;

            before(function (done) {
                api.PayIns.get(payIn.Id, function (data, response) {
                    getPayIn = data;
                    done();
                });
            });

            it('should succeed', function () {
                expect(getPayIn.Id).to.equal(payIn.Id);
                expect(getPayIn.BankAccount.Type).to.equal('IBAN');
                expect(getPayIn.AuthorId).to.equal(john.Id);
                expect(getPayIn.ExecutionType).to.equal('DIRECT');
                expect(getPayIn.Type).to.equal('PAYIN');
                expect(getPayIn.Status).to.equal('CREATED');
            });
        });
    });

    describe('DirectDebitWeb', function () {
        var payIn, wallet;

        before(function (done) {
            wallet = {
                Owners: [john.Id],
                Currency: 'EUR',
                Description: 'WALLET IN EUR'
            };

            api.Wallets.create(wallet).then(function () {
                done();
            });
        });

        describe('Create', function () {
            before(function (done) {
                payIn = {
                    CreditedWalletId: wallet.Id,
                    AuthorId: john.Id,
                    DebitedFunds: {
                        Amount: 10000,
                        Currency: 'EUR'
                    },
                    Fees: {
                        Amount: 100,
                        Currency: 'EUR'
                    },
                    PaymentType: 'DIRECT_DEBIT',
                    ExecutionType: 'WEB',
                    DirectDebitType: 'GIROPAY',
                    ReturnURL: 'http://www.mysite.com/returnURL/',
                    Culture: 'FR',
                    PAYLINE: 'https://www.maysite.com/payline_template/'
                };

                api.PayIns.create(payIn, function (data, response) {
                    done();
                });
            });

            it('should succeed', function () {
                expect(payIn.Id).not.to.be.undefined;
                expect(payIn.data.AuthorId).to.equal(john.Id);
                expect(payIn.data.PaymentType).to.equal('DIRECT_DEBIT');
                expect(payIn.data.ExecutionType).to.equal('WEB');
                expect(payIn.data.CardId).not.to.be.null;
                expect(payIn.data.Type).to.equal('PAYIN');
                expect(payIn.data.Status).to.equal('CREATED');
            });
        });
    });

    describe('PayPalWeb', function () {
        var payIn, wallet;

        before(function (done) {
            wallet = {
                Owners: [john.Id],
                Currency: 'EUR',
                Description: 'WALLET IN EUR'
            };

            api.Wallets.create(wallet).then(function () {
                done();
            });
        });

        describe('Create', function () {
            var shippingAddress = {
                RecipientName: "Mangopay Test",
                Address: {
                    "AddressLine1": "4101 Reservoir Rd NW",
                    "AddressLine2": "",
                    "City": "Washington",
                    "Region": "District of Columbia",
                    "PostalCode": "20007",
                    "Country": "US"
                }
            };

            before(function (done) {
                payIn = {
                    CreditedWalletId: wallet.Id,
                    AuthorId: john.Id,
                    CreditedUserId: john.Id,
                    DebitedFunds: {
                        Amount: 10000,
                        Currency: 'EUR'
                    },
                    Fees: {
                        Amount: 100,
                        Currency: 'EUR'
                    },
                    PaymentType: 'PAYPAL',
                    ExecutionType: 'WEB',
                    ReturnURL: 'http://www.mysite.com/returnURL/',
                    ShippingAddress: shippingAddress
                };

                api.PayIns.create(payIn, function (data, response) {
                    done();
                });
            });

            it('should be created', function () {
                expect(payIn.Id).not.to.be.undefined;
                expect(payIn.data.AuthorId).to.equal(john.Id);
                expect(payIn.data.PaymentType).to.equal('PAYPAL');
                expect(payIn.data.ExecutionType).to.equal('WEB');
                expect(payIn.data.CardId).not.to.be.null;
                expect(payIn.data.Type).to.equal('PAYIN');
                expect(payIn.data.Status).to.equal('CREATED');
            });

            describe('Get', function () {
                var getPayIn;

                before(function (done) {
                    api.PayIns.get(payIn.Id, function (data, response) {
                        getPayIn = data;
                        done();
                    });
                });

                it('should be retrieved', function () {
                    expect(getPayIn.Id).not.to.be.undefined;
                    expect(getPayIn.Id).to.equal(payIn.Id);
                    expect(getPayIn.ShippingAddress).not.to.be.undefined;
                    expect(getPayIn.ShippingAddress).to.deep.equal(shippingAddress);
                });
            });
        });

        describe("Get with Email", function () {
            var payInId = "54088959";
            var accountEmail = "paypal-buyer-user@mangopay.com"
            var payinWithEmail;

            before(function (done) {
                api.PayIns.get(payInId, function (data, response) {
                    payinWithEmail = data;
                    done();
                });
            });

            it("should contain buyer's email", function () {
                expect(payinWithEmail).not.to.be.undefined;
                expect(payinWithEmail.Id).to.equal(payInId);
                expect(payinWithEmail.PaypalBuyerAccountEmail).not.to.be.undefined;
                expect(payinWithEmail.PaypalBuyerAccountEmail).to.equal(accountEmail);
            });
        });

    });

    describe('Get Refunds', function () {
        var getRefunds;

        before(function (done) {
            api.PayIns.getRefunds(payIn.Id, function (data, response) {
                getRefunds = data;
                done();
            });
        });

        it('should be retrieved', function () {
            expect(getRefunds).not.to.be.undefined;
            expect(getRefunds).to.be.an('array');
        });
    });
});