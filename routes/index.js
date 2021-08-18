const express = require('express');
const router = express.Router();
const {post} = require('axios');

/*
 * GET /, order.html 렌더링
 */
router.get('/', (req, res) => {
    const userData = {
        buyer_no: 2335,
        buyer_name: '홍길동',
        buyer_hp: '01012345678',
        buyer_email: 'test@payple.kr',
        buy_goods: '휴대폰',
        buy_total: '1000',
        order_num: 'test',
        oid: createOid()
    }
    res.render('order', {userData});
});


/*
* POST /order_confirm, 결제 확인 렌더링(order_confirm.html)
*/
router.post('/order_confirm', (req, res) => {
    const data = {
        pcd_cpay_ver: req.body.pcd_cpay_ver,          // 결제창 버전 (Default : 1.0.1)
        is_direct: req.body.is_direct,                // 결제창 방식 (DIRECT: Y | POPUP: N)
        pay_type: req.body.pay_type,                  // 결제수단
        work_type: req.body.work_type,                // 결제요청방식
        card_ver: req.body.card_ver,                  // DEFAULT: 01 (01: 정기결제 플렛폼, 02: 일반결제 플렛폼), 카드결제 시 필수
        payple_payer_id: req.body.payple_payer_id,    // 결제자 고유ID (본인인증 된 결제회원 고유 KEY)
        buyer_no: req.body.buyer_no,                  // 가맹점 회원 고유번호
        buyer_name: req.body.buyer_name,              // 결제자 이름
        buyer_hp: req.body.buyer_hp,                  // 결제자 휴대폰 번호
        buyer_email: req.body.buyer_email,            // 결제자 Email
        buy_goods: req.body.buy_goods,                // 결제 상품
        buy_total: req.body.buy_total,                // 결제 금액
        buy_istax: req.body.buy_istax,                // 과세여부 (과세: Y | 비과세(면세): N)
        buy_taxtotal: req.body.buy_taxtotal,          // 부가세(복합과세인 경우 필수)
        order_num: req.body.order_num,                // 주문번호
        pay_year: req.body.pay_year,                  // [정기결제] 결제 구분 년도
        pay_month: req.body.pay_month,                // [정기결제] 결제 구분 월
        is_reguler: req.body.is_reguler,              // 정기결제 여부 (Y | N)
        is_taxsave: req.body.is_taxsave,              // 현금영수증 발행여부
        simple_flag: req.body.simple_flag,            // 간편결제 여부
        auth_type: req.body.auth_type                 // [간편결제/정기결제] 본인인증 방식 (sms : 문자인증 | pwd : 패스워드 인증)
    };

    res.render('order_confirm', data);
});

/*
 * POST /auth, 가맹점 인증
 * 케이스별로 가맹점 인증 요청에 사용하는 요청변수가 다르니, Payple에서 제공하는 가이드를 통해 요청변수를 확인하시길 바랍니다.
 * ref: http://docs.payple.kr/bank/install/auth
 */
router.post('/auth', (req, res, next) => {
    /*
     * 운영서버(cpay)에서는 계약 후 발급받은 운영 ID, 운영 Key로 인증
     */
    const authURL = process.env.URL;                       // 가맹점 인증서버
    const params = {
        cst_id: process.env.CST_ID || '',                  // 가맹점 ID (실결제시 .env.json 파일내 발급받은 운영ID를 작성하시기 바랍니다.)
        custKey: process.env.CUST_KEY || '',               // 가맹점 Key (실결제시 .env.json 파일내 발급받은 운영Key를 작성하시기 바랍니다.)
        PCD_PAYCANCEL_FLAG: req.body.PCD_PAYCANCEL_FLAG,   // 승인취소 요청변수
        PCD_PAY_WORK: req.body.PCD_PAY_WORK,               // 결제요청 업무구분 (AUTH : 본인인증+계좌등록, CERT: 본인인증+계좌등록+결제요청등록(최종 결제승인요청 필요), PAY: 본인인증+계좌등록+결제완료)
        PCD_PAYCHECK_FLAG: req.body.PCD_PAYCHECK_FLAG,     // 결제결과조회 요청변수
        PCD_PAY_TYPE: req.body.PCD_PAY_TYPE,               // 결제 방법 (transfer | card)
        PCD_SIMPLE_FLAG: req.body.PCD_PAY_TYPE             // 간편결제 여부 (Y | N)
    };
    console.log(params);
    post(authURL, JSON.stringify(params), {         // 최초 발급된 가맹점인증 Auth Key
        headers: {
            'content-type': 'application/json',
            'referer': process.env.PCD_HTTP_REFERER        //API 서버를 따로 두고 있는 경우, Referer 에 가맹점의 도메인 고정
        }
    }).then((response) => {
        console.log({...response.data});
        res.json({...response.data});                // 발급받은 가맹점인증 Auth Key로 승인
    }).catch((error) => {
        console.error(error);
        next(error);
    });

    /**
     * return json
     {
        server_name: 'testcpay.payple.kr',
        result: 'success',
        result_msg: '사용자 인증 완료!!',
        cst_id: 'ZnRSL1Z2YlNqUjhaMDRVSzZWckhHdz09',
        custKey: 'TkdCdkFjcmhtTkdsaG1pSzhPYVY0Zz09',
        AuthKey: 'K0VnWlZ5TWZSaGNla1Vpay96YnNQQTFnYXcyVWxlSzJGTHdtNHpNTndIUmJIZ2IrUFI1VExnZzhvOGNqS2MwR0RXL2ZVVjNXbUNBSG43ajdJNXJlelZuKzBXenZNa2RQSGMwdzJlNndBS3dwMTF4Y29OMkdEaFI4RjZSQVpidVpMNGdDWGpTSWQ2bjJOZWRCOHVGdHZEZDhZZk82WkcxZUJia3piMTBvOFdaTStYL1B5UEt2MTlLMVdRMlE2UXQ2dm1Od08ySnhCVU91UHNYZ1RyQ01TUm9HeWNDTUFnbE96TDlBR09ZYmNNd2VSOXVCNnEvUnplaEdUNWdqRW42RTZGRzZ6NzdLdExHcWpyMFcvb2I2SWc9PQ==',
        PCD_PAY_HOST: 'https://testcpay.payple.kr',
        PCD_PAY_URL: '/index.php?ACT_=PAYM&CPAYVER=202105281747',
        return_url: 'https://testcpay.payple.kr/index.php?ACT_=PAYM&CPAYVER=202105281747'
    }
     */
});

/*
 * POST /result, 결제결과 렌더링(order_result.html)
 */
router.post('/result', (req, res) => {
    const data = {
        PCD_PAY_RST: req.body.PCD_PAY_RST,  // 결제요청 결과(success|error)
        PCD_PAY_MSG: req.body.PCD_PAY_MSG,  // 결제요청 결과 메시지
        PCD_PAY_WORK: req.body.PCD_PAY_WORK,
        // 결제요청 업무구분 (AUTH : 본인인증+계좌등록, CERT: 본인인증+계좌등록+결제요청등록(최종 결제승인요청 필요), PAY: 본인인증+계좌등록+결제완료)
        PCD_AUTH_KEY: req.body.PCD_AUTH_KEY,  // 결제용 인증키
        PCD_PAY_REQKEY: req.body.PCD_PAY_REQKEY,  // 결제요청 고유 KEY
        PCD_PAY_COFURL: req.body.PCD_PAY_COFURL,  // 결제승인요청 URL
        PCD_PAY_OID: req.body.PCD_PAY_OID,  // 주문번호
        PCD_PAY_TYPE: req.body.PCD_PAY_TYPE,  // 결제 방법 (transfer | card)
        PCD_PAYER_ID: req.body.PCD_PAYER_ID,  // 카드등록 후 리턴받은 빌링키
        PCD_PAYER_NO: req.body.PCD_PAYER_NO,  // 가맹점 회원 고유번호
        PCD_PAY_GOODS: req.body.PCD_PAY_GOODS,  // 결제 상품
        PCD_PAY_TOTAL: req.body.PCD_PAY_TOTAL,  // 결제 금액
        PCD_PAY_TAXTOTAL: req.body.PCD_PAY_TAXTOTAL,
        // 복합과세(과세+면세) 주문건에 필요한 금액이며 가맹점에서 전송한 값을 부가세로 설정합니다. 과세 또는 비과세의 경우 사용하지 않습니다.
        PCD_PAY_ISTAX: req.body.PCD_PAY_ISTAX,  // 과세설정 (Default: Y, 과세:Y, 복합과세:Y, 비과세: N)
        PCD_PAYER_EMAIL: req.body.PCD_PAYER_EMAIL,  // 결제자 Email
        PCD_PAY_YEAR: req.body.PCD_PAY_YEAR,  // 결제 구분 년도 (PCD_REGULER_FLAG 사용시 응답)
        PCD_PAY_MONTH: req.body.PCD_PAY_MONTH,  // 결제 구분 월 (PCD_REGULER_FLAG 사용시 응답)
        PCD_PAY_TIME: req.body.PCD_PAY_TIME,  // 결제 시간 (format: yyyyMMddHHmmss, ex: 20210610142219)
        PCD_REGULER_FLAG: req.body.PCD_REGULER_FLAG,  // 정기결제 여부 (Y | N)
        PCD_TAXSAVE_RST: req.body.PCD_TAXSAVE_RST,  // 현금영수증 발행결과 (Y | N)
        PCD_PAYER_NAME: req.body.PCD_PAYER_NAME   // 결제자 이름
    };

    if (data.PCD_PAY_TYPE === 'transfer') {
        data.PCD_PAY_BANK = req.body.PCD_PAY_BANK;   // [계좌결제] 은행코드
        data.PCD_PAY_BANKNAME = req.body.PCD_PAY_BANKNAME;   // [계좌결제] 은행코드
        data.PCD_PAY_BANKNUM = req.body.PCD_PAY_BANKNUM;  // [계좌결제] 계좌번호(중간 6자리 * 처리)
    } else if (data.PCD_PAY_TYPE === 'card') {
        data.PCD_PAY_CARDNAME = req.body.PCD_PAY_CARDNAME;  // [카드결제] 카드사명
        data.PCD_PAY_CARDNUM = req.body.PCD_PAY_CARDNUM;  // [카드결제] 카드번호 (ex: 1234-****-****-5678)
        data.PCD_PAY_CARDTRADENUM = req.body.PCD_PAY_CARDTRADENUM;  // [카드결제] 카드결제 거래번호
        data.PCD_PAY_CARDAUTHNO = req.body.PCD_PAY_CARDAUTHNO;  // [카드결제] 카드결제 승인번호
        data.PCD_PAY_CARDRECEIPT = req.body.PCD_PAY_CARDRECEIPT;  // [카드결제] 카드전표 URL
    }
    res.render('order_result', data);
});

/*
 * POST /payconfirm, 최종승인 요청
 */
router.post('/payconfirm', (req, res, next) => {
    const payConfirmURL = req.body.PCD_PAY_COFURL;  // 결제승인요청 URL
    const params = {
        PCD_CST_ID: process.env.CST_ID,             // 가맹점 ID
        PCD_CUST_KEY: process.env.CUST_KEY,         // 가맹점 Key
        PCD_AUTH_KEY: req.body.PCD_AUTH_KEY,        // 결제용 인증키
        PCD_PAY_TYPE: req.body.PCD_PAY_TYPE,        // 결제방법
        PCD_PAYER_ID: req.body.PCD_PAYER_ID,        // 결제자 고유ID
        PCD_PAY_REQKEY: req.body.PCD_PAY_REQKEY     // 결제요청 고유KEY
    }

    post(payConfirmURL, JSON.stringify(params), {
        headers: {
            'content-type': 'application/json',
            'referer': process.env.PCD_HTTP_REFERER    //API 서버를 따로 두고 있는 경우, Referer 에 가맹점의 도메인 고정
        }
    })
        .then(response => res.json({...response.data}))
        .catch(err => console.error(err));
});

/*
 * POST /refund, 환불(승인취소)
 * ref (bank): http://docs.payple.kr/bank/pay/cancel
 * ref (card): http://docs.payple.kr/card/pay/cancel
 */
router.post('/refund', (req, res) => {
    //환불(승인취소)전 가맹점 인증 (기존 가맹점인증 라우터 이용 - POST /auth)
    // console.log('refund', process.env.HOSTNAME);
    post(process.env.HOSTNAME + '/node/auth', {PCD_PAYCANCEL_FLAG: "Y"}).then(r => {
        const refundURL = r.data.return_url;                 // 리턴 받은 환불(승인취소) URL
        const params = {
            PCD_CST_ID: r.data.cst_id,                       // 리턴 받은 cst_id Token
            PCD_CUST_KEY: r.data.custKey,                    // 리턴 받은 custKey Token
            PCD_AUTH_KEY: r.data.AuthKey,                    // 리턴 받은 AuthKey Token
            PCD_REFUND_KEY: process.env.PCD_REFUND_KEY,      // 환불서비스 Key (관리자페이지 상점정보 > 기본정보에서 확인하실 수 있습니다.)
            PCD_PAYCANCEL_FLAG: "Y",                         // 'Y' – 고정 값
            PCD_PAY_OID: req.body.PCD_PAY_OID,               // 주문번호
            PCD_PAY_DATE: req.body.PCD_PAY_DATE,             // 취소할 원거래일자
            PCD_REFUND_TOTAL: req.body.PCD_REFUND_TOTAL,     // 환불 요청금액 (기존 결제금액보다 적은 금액 입력 시 부분취소로 진행)
            PCD_REGULER_FLAG: req.body.PCD_REGULER_FLAG,     // 월 중복결제 방지 Y(사용) | N(그 외)
            PCD_PAY_YEAR: req.body.PCD_PAY_YEAR,             // 결제 구분 년도
            PCD_PAY_MONTH: req.body.PCD_PAY_MONTH,           // 결제 구분 월
        }

        post(refundURL, JSON.stringify(params), {
            headers: {
                'content-type': 'application/json',
                'referer': process.env.PCD_HTTP_REFERER    // API 서버를 따로 두고 있는 경우, Referer 에 가맹점의 도메인 고정
            }
        })
            .then(r2 => res.json({...r2.data}))
            .catch(err => console.error(err));
    }).catch(err => console.error(err));

});

/*
 * POST /taxsaveReg, 현금영수증 발행요청
 * ref: http://docs.payple.kr/bank/recipt/request
 */
router.post('/taxsaveReg', (req, res) => {
    //(기존 가맹점인증 라우터 이용 - POST process.env.HOSTNAME/public_html/sample/node/auth)
    //[현금영수증 취소 요청]가맹점인증 요청변수: PCD_PAY_WORK = 'TSREG'(발행요청) | 'TSCANCEL'(발행취소)
    post(process.env.HOSTNAME + '/node/auth', {PCD_PAY_WORK: 'TSREG'}).then(r => {
        const taxSaveURL = r.data.return_url;                         // 리턴 받은 현금영수증 요청 URL
        const params = {
            PCD_CST_ID: r.data.cst_id,                                // 리턴 받은 cst_id Token
            PCD_CUST_KEY: r.data.custKey,                             // 리턴 받은 custKey Token
            PCD_AUTH_KEY: r.data.AuthKey,                             // 리턴 받은 AuthKey Token
            PCD_PAYER_ID: req.body.PCD_PAYER_ID,                      // 계좌등록 후 리턴 받은 결제(빌링) KEY
            PCD_PAY_OID: req.body.PCD_PAY_OID,                        // 주문번호
            PCD_TAXSAVE_AMOUNT: req.body.PCD_TAXSAVE_AMOUNT,          // 현금영수증 발행금액
            PCD_REGULER_FLAG: req.body.PCD_REGULER_FLAG,              // 월 중복결제 방지 Y(사용) | N(그 외)
            PCD_TAXSAVE_TRADEUSE: req.body.PCD_TAXSAVE_TRADEUSE,      // personal(소득공제) | company(지출증빙)
            PCD_TAXSAVE_IDENTINUM: req.body.PCD_TAXSAVE_IDENTINUM,    // 현금영수증 발행대상 번호 (미입력시 결제내역 정보 이용)
        }

        post(taxSaveURL, JSON.stringify(params), {
            headers: {
                'content-type': 'application/json',
                'referer': process.env.PCD_HTTP_REFERER  // API 서버를 따로 두고 있는 경우, Referer 에 가맹점의 도메인 고정
            }
        })
            .then(r2 => {
                res.json({...r2.data});
            })
            .catch(err => console.error(err));
    });
});

/*
 * POST /taxsaveCan, 현금영수증 취소요청
 * ref: http://docs.payple.kr/bank/recipt/cancel
 */
router.post('/taxsaveCan', (req, res) => {
    //(기존 가맹점인증 라우터 이용 - POST process.env.HOSTNAME/public_html/sample/node/auth)
    //[현금영수증 취소 요청]가맹점인증 요청변수: PCD_PAY_WORK = 'TSREG':발행요청 || 'TSCANCEL':발행취소
    post(process.env.HOSTNAME + '/node/auth', {PCD_PAY_WORK: 'TSCANCEL'}).then(r => {
        const cancelURL = r.data.return_url;                         // 리턴 받은 현금영수증 취소 요청 URL
        const params = {
            PCD_CST_ID: r.data.cst_id,                               // 리턴 받은 cst_id Token
            PCD_CUST_KEY: r.data.custKey,                            // 리턴 받은 custKey Token
            PCD_AUTH_KEY: r.data.AuthKey,                            // 리턴 받은 AuthKey Token
            PCD_PAYER_ID: req.body.PCD_PAYER_ID,                     // 계좌등록 후 리턴 받은 결제(빌링) KEY
            PCD_PAY_OID: req.body.PCD_PAY_OID,                       // 주문번호
            PCD_REGULER_FLAG: req.body.PCD_REGULER_FLAG,             // Y(정기결제) | N(단건결제)
            PCD_TAXSAVE_TRADEUSE: req.body.PCD_TAXSAVE_TRADEUSE,     // personal(소득공제) | company(지출증빙)
            PCD_TAXSAVE_IDENTINUM: req.body.PCD_TAXSAVE_IDENTINUM,   // 휴대폰번호, 사업자번호 (미입력 시 결제내역 정보 이용)
        }

        post(cancelURL, JSON.stringify(params), {
            headers: {
                'content-type': 'application/json',
                'referer': process.env.PCD_HTTP_REFERER  // API 서버를 따로 두고 있는 경우, Referer 에 가맹점의 도메인 고정
            }
        })
            .then(r2 => {
                res.json({...r2.data});
            })
            .catch(err => console.error(err));
    });
});

/*
 * POST /paycheck, 결제결과 조회요청
 * ref: http://docs.payple.kr/bank/result/search
 */
router.post('/paycheck', (req, res) => {
    //(기존 가맹점인증 라우터 이용 - POST process.env.HOSTNAME/public_html/sample/node/auth)
    //[결제결과조회]가맹점인증 요청변수: PCD_PAYCHECK_FLAG: 'Y'
    post(process.env.HOSTNAME + '/node/auth', {PCD_PAYCHECK_FLAG: 'Y'}).then(r => {
        const paycheckURL = r.data.return_url;             // 리턴 받은 결제결과 요청 URL
        const params = {
            PCD_CST_ID: r.data.cst_id,                     // 리턴 받은 cst_id Token
            PCD_CUST_KEY: r.data.custKey,                  // 리턴 받은 custKey Token
            PCD_AUTH_KEY: r.data.AuthKey,                  // 리턴 받은 AuthKey Token
            PCD_PAYCHK_FLAG: 'Y',                          // 결과조회 여부(Y|N)
            PCD_PAY_TYPE: req.body.PCD_PAY_TYPE,           // 결제수단
            PCD_REGULER_FLAG: req.body.PCD_REGULER_FLAG,   // 월 중복결제 방지 (사용: Y, 그 외: N)
            PCD_PAY_YEAR: req.body.PCD_PAY_YEAR,           // 결제 구분 년도 (PCD_REGULER_FLAG: 'Y' 일 때 필수)
            PCD_PAY_MONTH: req.body.PCD_PAY_MONTH,         // 결제 구분 월 (PCD_REGULER_FLAG: 'Y' 일 때 필수)
            PCD_PAY_OID: req.body.PCD_PAY_OID,             // 주문번호
            PCD_PAY_DATE: req.body.PCD_PAY_DATE            // 결제요청일자 (YYYYMMDD)
        }

        post(paycheckURL, JSON.stringify(params), {
            headers: {
                'content-type': 'application/json',
                'referer': process.env.PCD_HTTP_REFERER  // API 서버를 따로 두고 있는 경우, Referer 에 가맹점의 도메인 고정
            }
        })
            .then(r2 => {
                console.log(r2.data);
                res.json({...r2.data});
            })
            .catch(err => console.error(err));
    });
});

/*
 * 계좌 간편 단건결제 요청 REST
 * ref: http://docs.payple.kr/bank/pay/outline
 */
router.post('/transferSimple', (req, res) => {
    //(기존 가맹점인증 라우터 이용 - POST process.env.HOSTNAME/public_html/sample/node/auth)
    //[계좌 간편 단건 결제요청]가맹점인증 요청변수: PCD_PAY_TYPE, PCD_SIMPLE_FLAG
    post(process.env.HOSTNAME + '/node/auth', {
        PCD_PAY_TYPE: 'transfer',                                // 결제 방법 (transfer | card)
        PCD_SIMPLE_FLAG: 'Y'                                     // 간편결제 여부 (Y | N)
    }).then(r => {
        const transferURL = r.data.return_url;                   // 리턴 받은 결제결과 요청 URL
        const params = {
            PCD_CST_ID: r.data.cst_id,                           // 리턴 받은 cst_id Token
            PCD_CUST_KEY: r.data.custKey,                        // 리턴 받은 custKey Token
            PCD_AUTH_KEY: r.data.AuthKey,                        // 리턴 받은 AuthKey Token
            PCD_PAY_TYPE: 'transfer',                            // 결제수단
            PCD_PAYER_ID: req.body.PCD_PAYER_ID,                 // 결제자 고유ID
            PCD_PAYER_NO: req.body.PCD_PAYER_NO,                 // 가맹점 회원 고유번호
            PCD_PAYER_EMAIL: req.body.PCD_PAYER_EMAIL,           // 결제자 Email
            PCD_PAY_OID: req.body.PCD_PAY_OID,                   // 주문번호
            PCD_PAY_GOODS: req.body.PCD_PAY_GOODS,               // 결제 상품
            PCD_PAY_TOTAL: req.body.PCD_PAY_TOTAL,               // 결제 금액
            PCD_PAY_ISTAX: req.body.PCD_PAY_ISTAX || 'Y',        // 과세설정 (Default: Y, 과세:Y, 복합과세:Y, 비과세: N)
            PCD_PAY_TAXTOTAL: req.body.PCD_PAY_TAXTOTAL,         // 복합과세(과세+면세) 주문건에 필요한 금액이며 가맹점에서 전송한 값을 부가세로 설정합니다. 과세 또는 비과세의 경우 사용하지 않습니다.
            PCD_TAXSAVE_FLAG: req.body.PCD_TAXSAVE_FLAG || 'N',  // 현금영수증 발행여부 (Default:N, 발행: Y, 미발행: N)
            PCD_SIMPLE_FLAG: 'Y',                                // 간편결제 여부 (Y | N)
            PCD_TAXSAVE_TRADE: req.body.PCD_TAXSAVE_TRADE,       // personal(소득공제) | company(지출증빙)
            PCD_TAXSAVE_IDNUM: req.body.PCD_TAXSAVE_IDNUM        // 현금영수증 발행 번호
        }
        post(transferURL, JSON.stringify(params), {
            headers: {
                'content-type': 'application/json',
                'referer': process.env.PCD_HTTP_REFERER          // API 서버를 따로 두고 있는 경우, Referer 에 가맹점의 도메인 고정
            }
        })
            .then(r2 => {
                console.log(r2.data);
                res.json({...r2.data});
            })
            .catch(err => console.error(err));
    });
});

/*
 * 계좌 간편 정기결제 요청 REST
 * ref: http://docs.payple.kr/bank/pay/outline
 */
router.post('/transferReguler', (req, res) => {
    //(기존 가맹점인증 라우터 이용 - POST process.env.HOSTNAME/public_html/sample/node/auth)
    //[계좌 간편 정기결제]가맹점인증 요청변수: PCD_PAY_TYPE, PCD_SIMPLE_FLAG
    post(process.env.HOSTNAME + '/node/auth', {
        PCD_PAY_TYPE: 'transfer',                                // 결제 방법 (transfer | card)
        PCD_SIMPLE_FLAG: 'Y'                                     // 간편결제 여부 (Y | N)
    }).then(r => {
        const transferURL = r.data.return_url;                   // 리턴 받은 결제결과 요청 URL
        const params = {
            PCD_CST_ID: r.data.cst_id,                           // 리턴 받은 cst_id Token
            PCD_CUST_KEY: r.data.custKey,                        // 리턴 받은 custKey Token
            PCD_AUTH_KEY: r.data.AuthKey,                        // 리턴 받은 AuthKey Token
            PCD_PAY_TYPE: 'transfer',                            // 결제수단
            PCD_PAYER_ID: req.body.PCD_PAYER_ID,                 // 결제자 고유ID
            PCD_PAYER_NO: req.body.PCD_PAYER_NO,                 // 가맹점 회원 고유번호
            PCD_PAYER_EMAIL: req.body.PCD_PAYER_EMAIL,           // 결제자 Email
            PCD_PAY_OID: req.body.PCD_PAY_OID,                   // 주문번호
            PCD_PAY_GOODS: req.body.PCD_PAY_GOODS,               // 결제 상품
            PCD_PAY_TOTAL: req.body.PCD_PAY_TOTAL,               // 결제 금액
            PCD_PAY_ISTAX: req.body.PCD_PAY_ISTAX || 'Y',        // 과세설정 (Default: Y, 과세:Y, 복합과세:Y, 비과세: N)
            PCD_PAY_TAXTOTAL: req.body.PCD_PAY_TAXTOTAL,         // 복합과세(과세+면세) 주문건에 필요한 금액이며 가맹점에서 전송한 값을 부가세로 설정합니다. 과세 또는 비과세의 경우 사용하지 않습니다.
            PCD_TAXSAVE_FLAG: req.body.PCD_TAXSAVE_FLAG || 'N',  // 현금영수증 발행여부 (Default:N, 발행: Y, 미발행: N)
            PCD_REGULER_FLAG: 'Y',                               // 간편결제 여부 (Y | N)
            PCD_PAY_YEAR: req.body.PCD_PAY_YEAR,                 // [정기결제] 구분 년도
            PCD_PAY_MONTH: req.body.PCD_PAY_MONTH,               // [정기결제] 결제 구분 월
            PCD_TAXSAVE_TRADE: req.body.PCD_TAXSAVE_TRADE,       // personal(소득공제) | company(지출증빙)
            PCD_TAXSAVE_IDNUM: req.body.PCD_TAXSAVE_IDNUM        // 현금영수증 발행 번호
        }
        post(transferURL, JSON.stringify(params), {
            headers: {
                'content-type': 'application/json',
                'referer': process.env.PCD_HTTP_REFERER          // API 서버를 따로 두고 있는 경우, Referer 에 가맹점의 도메인 고정
            }
        })
            .then(r2 => {
                console.log(r2.data);
                res.json({...r2.data});
            })
            .catch(err => console.error(err));
    });
});


/*
 * 카드 간편 단건결제 요청 REST
 * ref: http://docs.payple.kr/card/pay/outline
 */
router.post('/simplePayCard', (req, res) => {
    //(기존 가맹점인증 라우터 이용 - POST process.env.HOSTNAME/public_html/sample/node/auth)
    //[카드 간편 단건결제 요청]가맹점인증 요청변수: PCD_PAY_TYPE, PCD_SIMPLE_FLAG
    post(process.env.HOSTNAME + '/node/auth', {
        PCD_PAY_TYPE: 'card',                                    // 결제 방법 (transfer | card)
        PCD_SIMPLE_FLAG: 'Y'                                     // 간편결제 여부 (Y | N)
    }).then(r => {
        const simplePayCardURL = r.data.return_url;              // 리턴 받은 결제결과 요청 URL
        const params = {
            PCD_CST_ID: r.data.cst_id,                           // 리턴 받은 cst_id Token
            PCD_CUST_KEY: r.data.custKey,                        // 리턴 받은 custKey Token
            PCD_AUTH_KEY: r.data.AuthKey,                        // 리턴 받은 AuthKey Token
            PCD_PAY_TYPE: 'card',                                // 결제수단
            PCD_PAYER_ID: req.body.PCD_PAYER_ID,                 // 결제자 고유ID
            PCD_PAYER_NO: req.body.PCD_PAYER_NO,                 // 가맹점 회원 고유번호
            PCD_PAYER_EMAIL: req.body.PCD_PAYER_EMAIL,           // 결제자 Email
            PCD_PAY_OID: req.body.PCD_PAY_OID,                   // 주문번호
            PCD_PAY_GOODS: req.body.PCD_PAY_GOODS,               // 결제 상품
            PCD_PAY_TOTAL: req.body.PCD_PAY_TOTAL,               // 결제 금액
            PCD_PAY_ISTAX: req.body.PCD_PAY_ISTAX || 'Y',        // 과세설정 (Default: Y, 과세:Y, 복합과세:Y, 비과세: N)
            PCD_PAY_TAXTOTAL: req.body.PCD_PAY_TAXTOTAL,         // 복합과세(과세+면세) 주문건에 필요한 금액이며 가맹점에서 전송한 값을 부가세로 설정합니다. 과세 또는 비과세의 경우 사용하지 않습니다.
            PCD_SIMPLE_FLAG: 'Y'                                 // 간편결제 여부 (Y | N)
        }
        post(simplePayCardURL, JSON.stringify(params), {
            headers: {
                'content-type': 'application/json',
                'referer': process.env.PCD_HTTP_REFERER          // API 서버를 따로 두고 있는 경우, Referer 에 가맹점의 도메인 고정
            }
        })
            .then(r2 => {
                console.log(r2.data);
                res.json({...r2.data});
            })
            .catch(err => console.error(err));
    });
});


/*
 * 카드 간편 정기결제 요청 REST
 * ref: http://docs.payple.kr/card/pay/outline
 */
router.post('/regulerPayCard', (req, res) => {
    //(기존 가맹점인증 라우터 이용 - POST process.env.HOSTNAME/public_html/sample/node/auth)
    //[카드 간편 정기결제 요청]가맹점인증 요청변수: PCD_PAY_TYPE, PCD_SIMPLE_FLAG
    post(process.env.HOSTNAME + '/node/auth', {
        PCD_PAY_TYPE: 'card',                                    // 결제 방법 (transfer | card)
        PCD_SIMPLE_FLAG: 'Y'                                     // 간편결제 여부 (Y | N)
    }).then(r => {
        const regulerPayCardURL = r.data.return_url;             // 리턴 받은 결제결과 요청 URL
        const params = {
            PCD_CST_ID: r.data.cst_id,                           // 리턴 받은 cst_id Token
            PCD_CUST_KEY: r.data.custKey,                        // 리턴 받은 custKey Token
            PCD_AUTH_KEY: r.data.AuthKey,                        // 리턴 받은 AuthKey Token
            PCD_PAY_TYPE: 'card',                                // 결제수단
            PCD_PAYER_ID: req.body.PCD_PAYER_ID,                 // 결제자 고유ID
            PCD_PAYER_NO: req.body.PCD_PAYER_NO,                 // 가맹점 회원 고유번호
            PCD_PAYER_EMAIL: req.body.PCD_PAYER_EMAIL,           // 결제자 Email
            PCD_PAY_OID: req.body.PCD_PAY_OID,                   // 주문번호
            PCD_PAY_GOODS: req.body.PCD_PAY_GOODS,               // 결제 상품
            PCD_PAY_TOTAL: req.body.PCD_PAY_TOTAL,               // 결제 금액
            PCD_PAY_ISTAX: req.body.PCD_PAY_ISTAX || 'Y',        // 과세설정 (Default: Y, 과세:Y, 복합과세:Y, 비과세: N)
            PCD_PAY_TAXTOTAL: req.body.PCD_PAY_TAXTOTAL,         // 복합과세(과세+면세) 주문건에 필요한 금액이며 가맹점에서 전송한 값을 부가세로 설정합니다. 과세 또는 비과세의 경우 사용하지 않습니다.
            PCD_REGULER_FLAG: 'Y',                               // 정기결제 여부 (Y | N)
            PCD_PAY_YEAR: req.body.PCD_PAY_YEAR,                 // [정기결제] 구분 년도
            PCD_PAY_MONTH: req.body.PCD_PAY_MONTH                // [정기결제] 결제 구분 월
        }
        post(regulerPayCardURL, JSON.stringify(params), {
            headers: {
                'content-type': 'application/json',
                'referer': process.env.PCD_HTTP_REFERER          // API 서버를 따로 두고 있는 경우, Referer 에 가맹점의 도메인 고정
            }
        })
            .then(r2 => {
                console.log(r2.data);
                res.json({...r2.data});
            })
            .catch(err => console.error(err));
    });
});

/*
 * 계좌/카드 등록해지 요청 REST
 * 계좌 ref: http://docs.payple.kr/bank/regist/cancel
 * 카드 ref: http://docs.payple.kr/card/regist/cancel
 */
router.post('/puserDel', (req, res) => {
    //(기존 가맹점인증 라우터 이용 - POST process.env.HOSTNAME/public_html/sample/node/auth)
    //[카드 간편 정기결제 요청]가맹점인증 요청변수: PCD_PAY_WORK
    post(process.env.HOSTNAME + '/node/auth', {
        PCD_PAY_WORK: 'PUSERDEL'                                 // 등록카드 해지 API 사용할 때 필수
    }).then(r => {
        const puserDelURL = r.data.return_url;                   // 리턴 받은 결제결과 요청 URL
        const params = {
            PCD_CST_ID: r.data.cst_id,                           // 리턴 받은 cst_id Token
            PCD_CUST_KEY: r.data.custKey,                        // 리턴 받은 custKey Token
            PCD_AUTH_KEY: r.data.AuthKey,                        // 리턴 받은 AuthKey Token
            PCD_PAYER_ID: req.body.PCD_PAYER_ID,                 // 결제자 고유ID
            PCD_PAYER_NO: req.body.PCD_PAYER_NO,                 // 가맹점 회원 고유번호
        }
        post(puserDelURL, JSON.stringify(params), {
            headers: {
                'content-type': 'application/json',
                'referer': process.env.PCD_HTTP_REFERER          // API 서버를 따로 두고 있는 경우, Referer 에 가맹점의 도메인 고정
            }
        })
            .then(r2 => {
                console.log(r2.data);
                res.json({...r2.data});
            })
            .catch(err => console.error(err));
    });
});


/* Oid 생성 함수
 * 리턴 예시: test202105281622170718461
 */
const createOid = () => {
    const now_date = new Date();
    const now_year = now_date.getFullYear();
    let now_month = now_date.getMonth() + 1;
    let now_day = now_date.getDate();
    now_month = (now_month < 10) ? '0' + now_month : now_month;
    now_day = (now_day < 10) ? '0' + now_day : now_day;
    return 'test' + now_year + now_month + now_day + now_date.getTime();

};


module.exports = router;
