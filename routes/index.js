const express = require('express');
const router = express.Router();
const {post} = require('axios');

/*
 * GET /, order.html 렌더링
 */
router.get('/', (req, res) => {
    const data = {
        payer_no: 2335,
        payer_name: '홍길동',
        payer_hp: '01012345678',
        payer_email: 'test@payple.kr',
        pay_goods: '휴대폰',
        pay_total: '1000',
        pay_oid: createOid(),
    }
    res.render('order', {data});
});


/*
* POST /order_confirm, 결제 확인 렌더링(order_confirm.html)
*/
router.post('/order_confirm', (req, res) => {
    const data = {
        is_direct: req.body.is_direct || 'N',               // 결제창 방식 (DIRECT: Y | POPUP: N)
        pay_type: req.body.pay_type || 'transfer',          // 결제수단
        pay_work: req.body.pay_work || 'PAY',               // 결제요청방식
        card_ver: req.body.card_ver || '01',                // DEFAULT: 01 (01: 정기결제 플렛폼, 02: 일반결제 플렛폼), 카드결제 시 필수
        payer_id: req.body.payer_id || '',                  // 결제자 고유ID (본인인증 된 결제회원 고유 KEY)
        payer_no: req.body.payer_no || '',                  // 파트너 회원 고유번호
        payer_name: req.body.payer_name || '',              // 결제자 이름
        payer_hp: req.body.payer_hp || '',                  // 결제자 휴대폰 번호
        payer_email: req.body.payer_email || '',            // 결제자 Email
        pay_goods: req.body.pay_goods || '',                // 결제 상품
        pay_total: req.body.pay_total || '',                // 결제 금액
        pay_istax: req.body.pay_istax || '',                // 과세여부 (과세: Y | 비과세(면세): N)
        pay_oid: req.body.pay_oid || '',                    // 주문번호
        taxsave_flag: req.body.taxsave_flag || '',          // 현금영수증 발행여부
        pay_taxtotal: req.body.pay_taxtotal || '',          // 부가세(복합과세인 경우 필수)
        simple_flag: req.body.simple_flag || 'N',           // 간편결제 여부
        payer_authtype: req.body.payer_authtype || '',      // [간편결제/정기결제] 본인인증 방식 (sms : 문자인증 | pwd : 패스워드 인증)
        hostname: process.env.HOSTNAME                      // 결제창 호출 URL
    };
    post(process.env.HOSTNAME + '/node/auth').then((response) => {
        data.authKey = response.data.AuthKey;               // 파트너 인증 후 획득할 수 있는 인증토큰 값
        data.payReqURL = response.data.return_url;          // 파트너 인증 후 (결제) 요청시 필요한 페이플 도메인 주소입니다.
        res.render('order_confirm', data);
    }).catch((error) => {
        console.error(error);
    });
});

/*
* POST /paySimpleCardSend, 카드 정기결제 재결제 렌더링(paySimpleCardSend.html)
*/
router.get('/paySimpleCardSend', (req, res) => {
    const data = {
        payer_id: "",
        pay_goods: "휴대폰",
        pay_total: "1000",
        payer_no: 2335,
        payer_email: "test@payple.kr"
    }

    res.render('paySimpleCardSend', data);
});

/*
* GET /paySimpleSend, 계좌 정기결제 재결제 렌더링(paySimpleSend.html)
*/
router.get('/paySimpleSend', (req, res) => {
    const data = {
        payer_id: "",
        pay_goods: "휴대폰",
        pay_total: "1000",
        payer_no: 2335,
        payer_email: "test@payple.kr"
    }

    res.render('paySimpleSend', data);
});

/*
* GET /payInfo, 결제결과 조회 렌더링(payInfo.html)
*/
router.get('/payInfo', (req, res) => {
    res.render('payInfo');
});

/*
* GET /payUser, 등록 조회 및 해지(카드/계좌) 렌더링(payUser.html)
*/
router.get('/payUser', (req, res) => {
    res.render('payUser');
});

/*
* GET /linkReg, URL링크결제 렌더링(linkReg.html)
*/
router.get('/linkReg', (req, res) => {
    res.render('linkReg');
});

/*
* GET /taxSaveReq, 현금영수증 발행/취소 렌더링(taxSaveReq.html)
*/
router.get('/taxSaveReq', (req, res) => {
    res.render('taxSaveReq');
});

/*
 * POST /auth, 파트너 인증
 */
router.post('/auth', (req, res, next) => {
    const authURL = process.env.URL;                       // 파트너 인증서버
    const caseParams = req.body;                           // 상황별 파트너 인증 파라미터
    const params = {
        cst_id: process.env.CST_ID,                        // 파트너 ID (실결제시 발급받은 운영ID를 작성하시기 바랍니다.)
        custKey: process.env.CUST_KEY,                     // 파트너 인증키 (실결제시 발급받은 운영Key를 작성하시기 바랍니다.)
        ...caseParams                                      // 상황별 파트너 인증 파라미터 구조 분해 할당
    };
    /*  ※ Referer 설정 방법
	TEST : referer에는 테스트 결제창을 띄우는 도메인을 넣어주셔야합니다. 결제창을 띄울 도메인과 referer값이 다르면 [AUTH0007] 응답이 발생합니다.
	REAL : referer에는 가맹점 도메인으로 등록된 도메인을 넣어주셔야합니다.
		   다른 도메인을 넣으시면 [AUTH0004] 응답이 발생합니다.
		   또한, TEST에서와 마찬가지로 결제창을 띄우는 도메인과 같아야 합니다.
    */
    post(authURL, JSON.stringify(params), {
        headers: {
            'content-type': 'application/json',
            'referer': process.env.PCD_HTTP_REFERER
        }
    }).then((response) => {
        console.log(response.data);
        res.json(response.data);
    }).catch((error) => {
        console.error(error);
        next(error);
    });
});

/*
 * POST /result, 결제결과 렌더링(order_result.html)
 */
router.post('/result', (req, res) => {
    const returnedData = req.body;
    console.log('결제결과 파라미터:', returnedData);
    const data = {
        pay_rst: req.body.PCD_PAY_RST || '',                      // 결제요청 결과 (success | error)
        pay_code: req.body.PCD_PAY_CODE || '',                    // 결제요청 결과 코드
        pay_msg: req.body.PCD_PAY_MSG || '',                      // 결제요청 결과 메세지
        pay_type: req.body.PCD_PAY_TYPE || '',                    // 결제수단 (transfer|card)
        card_ver: req.body.PCD_CARD_VER || '',                    // 카드 세부 결제방식
        pay_work: req.body.PCD_PAY_WORK || '',                    // 결제요청 방식 (AUTH | PAY | CERT)
        auth_key: req.body.PCD_AUTH_KEY || '',                    // 결제요청 파트너 인증 토큰 값
        pay_reqkey: req.body.PCD_PAY_REQKEY || '',                // (CERT 방식) 최종 결제요청 승인키
        pay_cofurl: req.body.PCD_PAY_COFURL || '',                // (CERT 방식) 최종 결제요청 URL

        payer_id: req.body.PCD_PAYER_ID || '',                    // 결제자 고유 ID (빌링키)
        payer_no: req.body.PCD_PAYER_NO || '',                    // 결제자 고유번호 (파트너사 회원 회원번호)
        payer_name: req.body.PCD_PAYER_NAME || '',                // 결제자 이름
        payer_hp: req.body.PCD_PAYER_HP || '',                    // 결제자 휴대전화번호
        payer_email: req.body.PCD_PAYER_EMAIL || '',              // 결제자 이메일 (출금결과 수신)
        pay_oid: req.body.PCD_PAY_OID || '',                      // 주문번호
        pay_goods: req.body.PCD_PAY_GOODS || '',                  // 상품명
        pay_total: req.body.PCD_PAY_TOTAL || '',                  // 결제요청금액
        pay_taxtotal: req.body.PCD_PAY_TAXTOTAL || '',            // 부가세(복합과세 적용 시)
        pay_istax: req.body.PCD_PAY_ISTAX || 'Y',                 // 과세 여부 (과세:Y 비과세:N)
        pay_time: req.body.PCD_PAY_TIME || '',                    // 결제완료 시간
        pay_date: req.body.PCD_PAY_TIME?.substring(0, 8) || '',   // 결제완료 일자
        pay_bankacctype: req.body.PCD_PAY_BANKACCTYPE || '',      // 고객 구분 (법인 | 개인 or 개인사업자)

        pay_bank: req.body.PCD_PAY_BANK || '',                    // 은행코드
        pay_bankname: req.body.PCD_PAY_BANKNAME || '',            // 은행명
        pay_banknum: req.body.PCD_PAY_BANKNUM || '',              // 계좌번호
        taxsave_rst: req.body.PCD_TAXSAVE_RST || '',              // 현금영수증 발행결과 (Y|N)

        pay_cardname: req.body.PCD_PAY_CARDNAME || '',            // 카드사명
        pay_cardnum: req.body.PCD_PAY_CARDNUM || '',              // 카드번호
        pay_cardtradenum: req.body.PCD_PAY_CARDTRADENUM || '',    // 카드 거래번호
        pay_cardauthno: req.body.PCD_PAY_CARDAUTHNO || '',        // 카드 승인번호
        pay_cardreceipt: req.body.PCD_PAY_CARDRECEIPT || '',      // 카드 매출전표 URL
        pay_cardtradenum: req.body.PCD_PAY_CARDTRADENUM || '',    // 카드 거래번호
    }

    res.render('order_result', {...data, returnedData});
});

/*
 * POST /payCertSend, 결제 요청(CERT)
 */
router.post('/payCertSend', (req, res, next) => {
    const payConfirmURL = req.body.PCD_PAY_COFURL;         // 결제승인요청 URL
    const pay_type = req.body.PCD_PAY_TYPE;               // 결제방법
    const params = {
        PCD_CST_ID: process.env.CST_ID,                   // 파트너 ID
        PCD_CUST_KEY: process.env.CUST_KEY,               // 파트너 인증키
        PCD_AUTH_KEY: req.body.PCD_AUTH_KEY || '',        // 결제용 인증키
        PCD_PAYER_ID: req.body.PCD_PAYER_ID || '',        // 결제자 고유ID
        PCD_PAY_REQKEY: req.body.PCD_PAY_REQKEY || ''     // 결제요청 고유KEY
    }

    post(payConfirmURL, JSON.stringify(params), {
        headers: {
            'content-type': 'application/json',
            'referer': process.env.PCD_HTTP_REFERER
        }
    }).then(response => {
        const returned = response.data;
        const data = {
            PCD_PAY_RST: returned.PCD_PAY_RST,                      // 요청 결과 (success | error)
            PCD_PAY_CODE: returned.PCD_PAY_CODE,                    // 요청 결과 코드
            PCD_PAY_MSG: returned.PCD_PAY_MSG,                      // 요청 결과 메시지
            PCD_PAY_REQKEY: returned.PCD_PAY_REQKEY,                // (CERT방식) 최종 결제요청 승인키
            PCD_PAY_OID: returned.PCD_PAY_OID,                      // 주문번호
            PCD_PAY_TYPE: returned.PCD_PAY_TYPE,                    // 결제수단 (transfer|card)
            PCD_PAYER_ID: returned.PCD_PAYER_ID,                    // 결제자 고유 ID (빌링키)
            PCD_PAYER_NO: returned.PCD_PAYER_NO,                    // 결제자 고유번호 (파트너사 회원 회원번호)
            PCD_PAYER_NAME: returned.PCD_PAYER_NAME,                // 결제자 이름
            PCD_PAYER_HP: returned.PCD_PAYER_HP,                    // 결제자 휴대전화번호
            PCD_PAYER_EMAIL: returned.PCD_PAYER_EMAIL,              // 결제자 이메일
            PCD_PAY_GOODS: returned.PCD_PAY_GOODS,                  // 상품명
            PCD_PAY_AMOUNT: returned.PCD_PAY_AMOUNT,                // 결제금액
            PCD_PAY_DISCOUNT: returned.PCD_PAY_DISCOUNT,            // 페이플 이벤트 할인금액
            PCD_PAY_AMOUNT_REAL: returned.PCD_PAY_AMOUNT_REAL,      // 실 결제금액
            PCD_PAY_TOTAL: returned.PCD_PAY_TOTAL,                  // 결제요청금액
            PCD_PAY_ISTAX: returned.PCD_PAY_ISTAX,                  // 과세 여부
            PCD_PAY_TAXTOTAL: returned.PCD_PAY_TAXTOTAL,            // 부가세(복합과세 적용 시)
            PCD_PAY_TIME: returned.PCD_PAY_TIME,                    // 결제완료 시간
        }

        if (pay_type === 'card') {
            data.PCD_PAY_CARDNAME = returned.PCD_PAY_CARDNAME;              // 카드사명
            data.PCD_PAY_CARDNUM = returned.PCD_PAY_CARDNUM;                // 카드번호
            data.PCD_PAY_CARDTRADENUM = returned.PCD_PAY_CARDTRADENUM;      // 카드결제 거래번호
            data.PCD_PAY_CARDAUTHNO = returned.PCD_PAY_CARDAUTHNO;          // 카드결제 승인번호
            data.PCD_PAY_CARDRECEIPT = returned.PCD_PAY_CARDRECEIPT;        // 카드 매출전표 URL
        } else if (pay_type === 'transfer') {
            data.PCD_PAY_BANK = returned.PCD_PAY_BANK;                      // 은행코드
            data.PCD_PAY_BANKNAME = returned.PCD_PAY_BANKNAME;              // 은행명
            data.PCD_PAY_BANKNUM = returned.PCD_PAY_BANKNUM;                // 계좌번호
            data.PCD_TAXSAVE_FLAG = returned.PCD_TAXSAVE_FLAG;              // 현금영수증 발행요청 (Y|N)
            data.PCD_TAXSAVE_RST = returned.PCD_TAXSAVE_RST;                // 현금영수증 발행결과 (Y|N)
        }
        res.json(data);
    }).catch(err => console.error(err));
});

/*
 * POST /payRefund, 환불(승인취소)
 */
router.post('/payRefund', (req, res) => {
    //환불(승인취소)전 파트너 인증
    post(process.env.HOSTNAME + '/node/auth', {PCD_PAYCANCEL_FLAG: "Y"}).then(auth => {
        const refundURL = auth.data.return_url;                               // 리턴 받은 환불(승인취소) URL
        const params = {
            PCD_CST_ID: auth.data.cst_id,                                     // 리턴 받은 cst_id Token
            PCD_CUST_KEY: auth.data.custKey,                                  // 리턴 받은 custKey Token
            PCD_AUTH_KEY: auth.data.AuthKey,                                  // 리턴 받은 AuthKey Token
            PCD_REFUND_KEY: process.env.PCD_REFUND_KEY,                       // 환불서비스 Key (관리자페이지 상점정보 > 기본정보에서 확인하실 수 있습니다)
            PCD_PAYCANCEL_FLAG: "Y",                                          // 'Y' – 고정 값
            PCD_PAY_OID: req.body.PCD_PAY_OID || '',                          // (필수) 주문번호
            PCD_PAY_DATE: req.body.PCD_PAY_DATE || '',                        // (필수) 원거래 결제일자
            PCD_REFUND_TOTAL: req.body.PCD_REFUND_TOTAL || '',                // (필수) 결제취소 요청금액
            PCD_REFUND_TAXTOTAL: req.body.PCD_REFUND_TAXTOTAL || ''           // 결제취소 부가세
        }

        post(refundURL, JSON.stringify(params), {
            headers: {
                'content-type': 'application/json',
                'referer': process.env.PCD_HTTP_REFERER
            }
        }).then(response => {
            const returned = response.data;
            console.log('승인취소(환불) 파라미터:', returned);
            const data = {}
            if (returned.PCD_PAY_RST !== '') {
                data.PCD_PAY_RST = returned.PCD_PAY_RST;                       // 요청 결과 (success | error)
                data.PCD_PAY_MSG = returned.PCD_PAY_MSG;                       // 요청 결과 메시지
                data.PCD_PAY_OID = returned.PCD_PAY_OID;                       // 주문번호
                data.PCD_PAY_TYPE = returned.PCD_PAY_TYPE;                     // 결제수단 (transfer|card)
                data.PCD_PAYER_NO = returned.PCD_PAYER_NO;                     // 결제자 고유 ID  (빌링키)
                data.PCD_PAYER_ID = returned.PCD_PAYER_ID;                     // 결제자 고유번호 (파트너사 회원 회원번호)
                data.PCD_PAY_GOODS = returned.PCD_PAY_GOODS;                   // 상품명
                data.PCD_REFUND_TOTAL = returned.PCD_REFUND_TOTAL;             // 결제취소 요청금액
                data.PCD_REFUND_TAXTOTAL = returned.PCD_REFUND_TAXTOTAL;       // 결제취소 부가세
            } else {
                data.PCD_PAY_RST = 'error';                                    // 요청 결과 (success | error)
                data.PCD_PAY_MSG = '환불요청실패';                                // 요청 결과 메시지
                data.PCD_PAY_OID = params.PCD_PAY_OID;                         // 주문번호
                data.PCD_PAY_TYPE = '';                                        // 결제수단 (transfer|card)
                data.PCD_PAYER_NO = '';                                        // 결제자 고유번호 (파트너사 회원 회원번호)
                data.PCD_PAYER_ID = '';                                        // 결제자 고유 ID  (빌링키)
                data.PCD_PAY_GOODS = '';                                       // 상품명
                data.PCD_REFUND_TOTAL = params.PCD_REFUND_TOTAL;               // 결제취소 요청금액
                data.PCD_REFUND_TAXTOTAL = params.PCD_REFUND_TAXTOTAL;         // 결제취소 부가세
            }
            res.json(data)
        }).catch(err => console.error(err));
    }).catch(err => console.error(err));

});

/*
 * POST /taxSaveReg, 현금영수증 발행/취소 요청
 */
router.post('/taxSaveReq', (req, res) => {
    // 현금영수증 발행, 취소 구분
    const reqType = req.body.PCD_TAXSAVE_REQUEST === 'regist' ? 'TSREG' : req.body.PCD_TAXSAVE_REQUEST === 'cancel' ? 'TSCANCEL' : '';
    post(process.env.HOSTNAME + '/node/auth', {PCD_PAY_WORK: reqType}).then(auth => {
        const taxSaveURL = auth.data.return_url;                               // 리턴 받은 현금영수증 요청 URL
        const params = {
            PCD_CST_ID: auth.data.cst_id,                                      // 리턴 받은 cst_id Token
            PCD_CUST_KEY: auth.data.custKey,                                   // 리턴 받은 custKey Token
            PCD_AUTH_KEY: auth.data.AuthKey,                                   // 리턴 받은 AuthKey Token
            PCD_PAYER_ID: req.body.PCD_PAYER_ID || '',                         // (필수) 결제자 고유 ID (빌링키)
            PCD_PAY_OID: req.body.PCD_PAY_OID || '',                           // (필수) 주문번호
            PCD_TAXSAVE_AMOUNT: req.body.PCD_TAXSAVE_AMOUNT || 0,              // (필수) 현금영수증 발행금액
            PCD_TAXSAVE_TRADEUSE: req.body.PCD_TAXSAVE_TRADEUSE || 'company',  // 현금영수증 발행 타입 (personal:소득공제용 | company:지출증빙)
            PCD_TAXSAVE_IDENTINUM: req.body.PCD_TAXSAVE_IDENTINUM || '',       // 현금영수증 발행대상 번호
        }

        post(taxSaveURL, JSON.stringify(params), {
            headers: {
                'content-type': 'application/json',
                'referer': process.env.PCD_HTTP_REFERER
            }
        }).then(response => {
            const returned = response.data;
            const data = {};
            if (returned.PCD_PAY_RST !== '') {
                data.PCD_PAY_RST = returned.PCD_PAY_RST;                     // 요청 결과 (success | error)
                data.PCD_PAY_CODE = returned.PCD_PAY_CODE;                   // 요청 결과 코드
                data.PCD_PAY_MSG = returned.PCD_PAY_MSG;                     // 요청 결과 메세지
                data.PCD_PAY_WORK = returned.PCD_PAY_WORK;                   // 요청 작업 구분 (TSREG | TSCANCEL)
                data.PCD_PAYER_ID = returned.PCD_PAYER_ID || '';             // 결제자 고유 ID (빌링키)
                data.PCD_PAY_OID = returned.PCD_PAY_OID;                     // 주문번호
                data.PCD_TAXSAVE_AMOUNT = returned.PCD_TAXSAVE_AMOUNT;       // 현금영수증 발행금액
                data.PCD_TAXSAVE_MGTNUM = returned.PCD_TAXSAVE_MGTNUM;       // 현금영수증 발행된 국세청 발행번호
            } else {
                data.PCD_PAY_RST = 'error';                                  // 요청 결과 (success | error)
                data.PCD_PAY_CODE = '';                                      // 요청 결과 코드
                data.PCD_PAY_MSG = '요청결과 수신 실패';                         // 요청 결과 메세지
                data.PCD_PAY_WORK = reqType;                                 // 요청 작업 구분 (TSREG | TSCANCEL)
                data.PCD_PAY_OID = params.PCD_PAY_OID;                       // 주문번호
                data.PCD_TAXSAVE_AMOUNT = '';                                // 현금영수증 발행금액
                data.PCD_TAXSAVE_MGTNUM = '';                                // 현금영수증 발행된 국세청 발행번호
            }
            res.json(data);
        }).catch(err => console.error(err));
    });
});

/*
 * POST /payInfo, 결제결과 조회 요청
 */
router.post('/payInfo', (req, res) => {
    // 파트너인증 요청변수: PCD_PAYCHK_FLAG: 'Y'
    post(process.env.HOSTNAME + '/node/auth', {PCD_PAYCHK_FLAG: 'Y'}).then(auth => {
        const payInfoURL = auth.data.return_url;                // 리턴 받은 결제결과 요청 URL
        const params = {
            PCD_CST_ID: auth.data.cst_id,                       // 리턴 받은 cst_id Token
            PCD_CUST_KEY: auth.data.custKey,                    // 리턴 받은 custKey Token
            PCD_AUTH_KEY: auth.data.AuthKey,                    // 리턴 받은 AuthKey Token
            PCD_PAYCHK_FLAG: 'Y',                               // 결과조회 여부(Y)
            PCD_PAY_TYPE: req.body.PCD_PAY_TYPE || 'transfer',  // (필수) 결제수단 (transfer|card)
            PCD_PAY_OID: req.body.PCD_PAY_OID || '',            // (필수) 주문번호
            PCD_PAY_DATE: req.body.PCD_PAY_DATE || ''           // (필수) 원거래 결제일자
        }
        post(payInfoURL, JSON.stringify(params), {
            headers: {
                'content-type': 'application/json',
                'referer': process.env.PCD_HTTP_REFERER
            }
        }).then(response => {
            const returned = response.data;
            const data = {};
            if (returned.PCD_PAY_RST !== '') {
                data.PCD_PAY_RST = returned.PCD_PAY_RST;                      // 요청 결과 (success | error)
                data.PCD_PAY_CODE = returned.PCD_PAY_CODE;                    // 요청 결과 코드
                data.PCD_PAY_MSG = returned.PCD_PAY_MSG;                      // 요청 결과 메시지
                data.PCD_PAY_OID = returned.PCD_PAY_OID;                      // 주문번호
                data.PCD_PAY_TYPE = returned.PCD_PAY_TYPE;                    // 결제수단 (transfer|card)
                data.PCD_PAYER_NO = returned.PCD_PAYER_NO;                    // 결제자 고유번호 (파트너사 회원 회원번호)
                data.PCD_PAYER_ID = returned.PCD_PAYER_ID;                    // 결제자 고유 ID (빌링키)
                data.PCD_PAYER_EMAIL = returned.PCD_PAYER_EMAIL;              // 결제자 이메일
                data.PCD_PAY_GOODS = returned.PCD_PAY_GOODS;                  // 상품명
                data.PCD_PAY_TOTAL = returned.PCD_PAY_TOTAL;                  // 결제요청금액
                data.PCD_PAY_TIME = returned.PCD_PAY_TIME;                    // 결제완료 시간
                data.PCD_PAY_ISTAX = returned.PCD_PAY_ISTAX || '';            // 과세 여부
                data.PCD_PAY_TAXTOTAL = returned.PCD_PAY_TAXTOTAL || '';      // 부가세(복합과세 적용 시)
                if (returned.PCD_PAY_TYPE === 'card') {
                    data.PCD_PAY_CARDNAME = returned.PCD_PAY_CARDNAME;               // 카드사명
                    data.PCD_PAY_CARDNUM = returned.PCD_PAY_CARDNUM;                 // 카드번호
                    data.PCD_PAY_CARDTRADENUM = returned.PCD_PAY_CARDTRADENUM;       // 카드 거래번호
                    data.PCD_PAY_CARDRECEIPT = returned.PCD_PAY_CARDRECEIPT;         // 카드 매출전표 URL
                    data.PCD_PAY_CARDAUTHNO = returned.PCD_PAY_CARDAUTHNO || '';     // 카드 승인번호
                } else if (returned.PCD_PAY_TYPE === 'transfer') {
                    data.PCD_PAY_BANK = returned.PCD_PAY_BANK;                       // 은행코드
                    data.PCD_PAY_BANKNAME = returned.PCD_PAY_BANKNAME;               // 은행명
                    data.PCD_PAY_BANKNUM = returned.PCD_PAY_BANKNUM;                 // 계좌번호
                    data.PCD_TAXSAVE_FLAG = returned.PCD_TAXSAVE_FLAG;               // 현금영수증 발행요청 (Y|N)
                    data.PCD_TAXSAVE_RST = returned.PCD_TAXSAVE_RST;                 // 현금영수증 발행결과 (Y|N)
                }
            } else {
                data.PCD_PAY_RST = "error";                       // 요청 결과 (success | error)
                data.PCD_PAY_CODE = "결제내역 조회 에러";              // 요 청 결과 코드
                data.PCD_PAY_MSG = "";                            // 요청 결과 메시지
                data.PCD_PAY_OID = params.PCD_PAY_OID;            // 주문번호
                data.PCD_PAY_TYPE = params.PCD_PAY_TYPE;          // 결제수단 (transfer|card)
                data.PCD_PAYER_NO = "";                           // 결제자 고유번호 (파트너사 회원 회원번호)
                data.PCD_PAYER_ID = "";                           // 결제자 고유 ID (빌링키)
                data.PCD_PAY_GOODS = "";                          // 상품명
                data.PCD_PAY_TOTAL = "";                          // 결제요청금액
                data.PCD_PAY_TIME = "";                           // 결제완료 시간
                data.PCD_TAXSAVE_RST = "";                        // 현금영수증 발행결과 (Y|N)
                if (params.PCD_PAY_TYPE === 'card') {
                    data.PCD_PAY_CARDNAME = "";                   // 카드사명
                    data.PCD_PAY_CARDNUM = "";                    // 카드번호
                    data.PCD_PAY_CARDTRADENUM = "";               // 카드 거래번호
                    data.PCD_PAY_CARDRECEIPT = "";                // 카드 매출전표 URL
                    data.PCD_PAY_CARDAUTHNO = "";                 // 카드 승인번호
                } else if (params.PCD_PAY_TYPE === 'transfer') {
                    data.PCD_PAY_BANK = "";                       // 은행코드
                    data.PCD_PAY_BANKNAME = "";                   // 은행명
                    data.PCD_PAY_BANKNUM = "";                    // 계좌번호
                    data.PCD_TAXSAVE_FLAG = "";                   // 현금영수증 발행요청 (Y|N)
                    data.PCD_TAXSAVE_RST = "";                    // 현금영수증 발행결과 (Y|N)
                }
            }
            res.json(data);
        }).catch(err => console.error(err));
    });
});

/*
 * POST /payUserInfo, 계좌/카드 등록조회 요청
 */
router.post('/payUserInfo', (req, res) => {
    //파트너인증 요청변수: PCD_PAY_WORK
    post(process.env.HOSTNAME + '/node/auth', {PCD_PAY_WORK: 'PUSERINFO'}).then(auth => {
        const puserInfoURL = auth.data.return_url;                  // 등록조회요청 URL
        const params = {
            PCD_CST_ID: auth.data.cst_id,                           // 리턴 받은 cst_id Token
            PCD_CUST_KEY: auth.data.custKey,                        // 리턴 받은 custKey Token
            PCD_AUTH_KEY: auth.data.AuthKey,                        // 리턴 받은 AuthKey Token
            PCD_PAYER_ID: req.body.PCD_PAYER_ID || '',              // 결제자 고유 ID (빌링키)
        }
        post(puserInfoURL, JSON.stringify(params), {
            headers: {
                'content-type': 'application/json',
                'referer': process.env.PCD_HTTP_REFERER
            }
        }).then(response => {
            const returned = response.data;
            console.log(returned);
            const data = {};
            if (returned.PCD_PAY_RST !== '') {
                data.PCD_PAY_RST = returned.PCD_PAY_RST;                             // 요청 결과 (success | error)
                data.PCD_PAY_CODE = returned.PCD_PAY_CODE;                           // 요청 결과 코드
                data.PCD_PAY_MSG = returned.PCD_PAY_MSG;                               // 요청 결과 메세지
                data.PCD_PAYER_ID = returned.PCD_PAYER_ID;                           // 결제자 고유 ID (빌링키)
                data.PCD_PAY_TYPE = returned.PCD_PAY_TYPE || '';                     // 결제수단 (transfer | card)
                data.PCD_PAY_WORK = returned.PCD_PAY_WORK || '';                     // 요청 작업 구분 (등록조회 : PUSERINFO)
                data.PCD_PAY_BANKACCTYPE = returned.PCD_PAY_BANKACCTYPE || '';       // 고객 구분 (법인 | 개인 or 개인사업자)
                data.PCD_PAYER_NAME = returned.PCD_PAYER_NAME || '';                 // 결제자 이름
                data.PCD_PAYER_HP = returned.PCD_PAYER_HP || '';                     // 결제자 휴대전화번호

                if (returned.PCD_PAY_TYPE === 'card') {
                    data.PCD_PAYER_HP = returned.PCD_PAYER_HP || '';                 // 카드사 코드
                    data.PCD_PAY_CARDNAME = returned.PCD_PAY_CARDNAME || '';         // 카드사명
                    data.PCD_PAY_CARDNUM = returned.PCD_PAY_CARDNUM || '';           // 카드번호
                } else if (returned.PCD_PAY_TYPE === 'transfer') {
                    data.PCD_PAY_BANK = returned.PCD_PAY_BANK || '';                 //은행코드
                    data.PCD_PAY_BANKNAME = returned.PCD_PAY_BANKNAME || '';         //은행명
                    data.PCD_PAY_BANKNUM = returned.PCD_PAY_BANKNUM || '';           //계좌번호
                }
            } else {
                data.PCD_PAY_RST = "error";                           // 요청 결과 (success | error)
                data.PCD_PAY_CODE = "";                               // 요청 결과 코드
                data.PCD_PAY_MSG = "요청결과 수신 실패";                  // 요청 결과 메세지
                data.PCD_PAY_TYPE = "";                               // 결제수단
                data.PCD_PAYER_ID = "";                               // 결제자 고유 ID (빌링키)
                data.PCD_PAY_BANKACCTYPE = "";                        // 고객 구분 (법인 | 개인 or 개인사업자)
                data.PCD_PAYER_ID = "";                               // 결제자 고유 ID (빌링키)
                data.PCD_PAYER_NAME = "";                             // 결제자 이름
                data.PCD_PAYER_HP = "";                               // 결제자 휴대전화번호
            }
            res.json(data);
        }).catch(err => console.error(err));
    });
});

/*
 * POST /payUserDel, 계좌/카드 등록해지 요청
 */
router.post('/payUserDel', (req, res) => {
    // 파트너인증 요청변수: PCD_PAY_WORK
    post(process.env.HOSTNAME + '/node/auth', {PCD_PAY_WORK: 'PUSERDEL'}).then(auth => {
        const puserDelURL = auth.data.return_url;                   // 등록해지 URL
        const params = {
            PCD_CST_ID: auth.data.cst_id,                           // 리턴 받은 cst_id Token
            PCD_CUST_KEY: auth.data.custKey,                        // 리턴 받은 custKey Token
            PCD_AUTH_KEY: auth.data.AuthKey,                        // 리턴 받은 AuthKey Token
            PCD_PAYER_ID: req.body.PCD_PAYER_ID || '',              // 결제자 고유 ID (빌링키)
        }
        post(puserDelURL, JSON.stringify(params), {
            headers: {
                'content-type': 'application/json',
                'referer': process.env.PCD_HTTP_REFERER
            }
        }).then(response => {
            const returned = response.data;
            const data = {};
            if (returned.PCD_PAY_RST !== '') {
                data.PCD_PAY_RST = returned.PCD_PAY_RST;              // 요청 결과 (success | error)
                data.PCD_PAY_CODE = returned.PCD_PAY_CODE;            // 요청 결과 코드
                data.PCD_PAY_MSG = returned.PCD_PAY_MSG;                // 요청 결과 메세지
                data.PCD_PAY_TYPE = returned.PCD_PAY_TYPE;            // 결제수단 (transfer | card)
                data.PCD_PAY_WORK = returned.PCD_PAY_WORK;            // 요청 작업 구분 (등록해지 : PUSERDEL)
                data.PCD_PAYER_ID = returned.PCD_PAYER_ID;            // 결제자 고유 ID (빌링키)
            } else {
                data.PCD_PAY_RST = "error";                           // 요청 결과 (success | error)
                data.PCD_PAY_CODE = "";                               // 요청 결과 코드
                data.PCD_PAY_MSG = "요청결과 수신 실패";                  // 요청 결과 메세지
                data.PCD_PAY_TYPE = "";                               // 결제수단
                data.PCD_PAY_WORK = "PUSERDEL";                       // 요청 작업 구분 (등록해지 : PUSERDEL)
                data.PCD_PAYER_ID = "";                               // 결제자 고유 ID (빌링키)
            }
            res.json(data);
        }).catch(err => console.error(err));
    });
});

/*
 * POST /paySimpleCardSend, 카드 정기결제 재결제
 */
router.post('/paySimpleCardSend', (req, res) => {
    // 파트너인증 요청변수: PCD_PAY_TYPE, PCD_SIMPLE_FLAG
    post(process.env.HOSTNAME + '/node/auth', {PCD_PAY_TYPE: 'card', PCD_SIMPLE_FLAG: 'Y'}).then(auth => {
        const payReqURL = auth.data.return_url;                         // 카드 정기결제 재결제 URL
        const params = {
            PCD_CST_ID: auth.data.cst_id,                               // 리턴 받은 cst_id Token
            PCD_CUST_KEY: auth.data.custKey,                            // 리턴 받은 custKey Token
            PCD_AUTH_KEY: auth.data.AuthKey,                            // 리턴 받은 AuthKey Token
            PCD_PAY_TYPE: 'card',                                       // (필수) 결제수단 (card)
            PCD_PAYER_ID: req.body.PCD_PAYER_ID || '',                  // (필수) 결제자 고유 ID (빌링키)
            PCD_PAY_GOODS: req.body.PCD_PAY_GOODS || '',                // (필수) 상품명
            PCD_SIMPLE_FLAG: 'Y',                                       // 간편결제 여부 (Y|N)
            PCD_PAY_TOTAL: req.body.PCD_PAY_TOTAL || '',                // (필수) 결제요청금액
            PCD_PAY_OID: req.body.PCD_PAY_OID || '',                    // 주문번호
            PCD_PAYER_NO: req.body.PCD_PAYER_NO || '',                  // 결제자 고유번호 (파트너사 회원 회원번호)
            PCD_PAYER_NAME: req.body.PCD_PAYER_NAME || '',              // 결제자 이름
            PCD_PAYER_HP: req.body.PCD_PAYER_HP || '' || '',            // 결제자 휴대전화번호
            PCD_PAYER_EMAIL: req.body.PCD_PAYER_EMAIL || '',            // 결제자 이메일
            PCD_PAY_ISTAX: req.body.PCD_PAY_ISTAX || 'Y',               // 과세여부
            PCD_PAY_TAXTOTAL: req.body.PCD_PAY_TAXTOTAL || '',          // 부가세(복합과세 적용 시)
        }
        post(payReqURL, JSON.stringify(params), {
            headers: {
                'content-type': 'application/json',
                'referer': process.env.PCD_HTTP_REFERER
            }
        }).then(response => {
            const returned = response.data;
            const data = {};
            if (returned.PCD_PAY_RST !== '') {
                data.PCD_PAY_RST = returned.PCD_PAY_RST;                    // 요청 결과 (success | error)
                data.PCD_PAY_CODE = returned.PCD_PAY_CODE;                  // 요청 결과 코드
                data.PCD_PAY_MSG = returned.PCD_PAY_MSG;                    // 요청 결과 메시지
                data.PCD_PAY_OID = returned.PCD_PAY_OID;                    // 주문번호
                data.PCD_PAY_TYPE = returned.PCD_PAY_TYPE;                  // 결제수단 (card)
                data.PCD_PAYER_NO = returned.PCD_PAYER_NO;                  // 결제자 고유번호 (파트너사 회원 회원번호)
                data.PCD_PAYER_ID = returned.PCD_PAYER_ID;                  // 결제자 고유 ID (빌링키)
                data.PCD_PAYER_NAME = returned.PCD_PAYER_NAME;              // 결제자 이름
                data.PCD_PAYER_HP = returned.PCD_PAYER_HP;                  // 결제자 휴대전화번호
                data.PCD_PAYER_EMAIL = returned.PCD_PAYER_EMAIL;            // 결제자 이메일
                data.PCD_PAY_GOODS = returned.PCD_PAY_GOODS;                // 상품명
                data.PCD_PAY_TOTAL = returned.PCD_PAY_TOTAL;                // 결제요청금액
                data.PCD_PAY_TAXTOTAL = returned.PCD_PAY_TAXTOTAL;          // 부가세(복합과세 적용 시)
                data.PCD_PAY_ISTAX = returned.PCD_PAY_ISTAX;                // 과세여부
                data.PCD_PAY_TIME = returned.PCD_PAY_TIME;                  // 결제완료 시간
                data.PCD_PAY_CARDNAME = returned.PCD_PAY_CARDNAME;          // 카드사명
                data.PCD_PAY_CARDNUM = returned.PCD_PAY_CARDNUM;            // 카드번호
                data.PCD_PAY_CARDTRADENUM = returned.PCD_PAY_CARDTRADENUM;  // 카드 거래번호
                data.PCD_PAY_CARDAUTHNO = returned.PCD_PAY_CARDAUTHNO;      // 카드 승인번호
                data.PCD_PAY_CARDRECEIPT = returned.PCD_PAY_CARDRECEIPT;    // 카드 매출전표 URL
                data.PCD_SIMPLE_FLAG = returned.PCD_SIMPLE_FLAG;            // 간편결제 여부 (Y|N)
            } else {
                data.PCD_PAY_RST = "error";                                 // 요청 결과 (success | error)
                data.PCD_PAY_CODE = "";                                     // 요청 결과 코드
                data.PCD_PAY_MSG = "카드결제실패";                             // 요청 결과 메시지
                data.PCD_PAY_OID = params.PCD_PAY_OID;                      // 주문번호
                data.PCD_PAY_TYPE = params.PCD_PAY_TYPE;                    // 결제수단 (card)
                data.PCD_PAYER_NO = params.PCD_PAYER_NO;                    // 결제자 고유번호 (파트너사 회원 회원번호)
                data.PCD_PAYER_ID = params.PCD_PAYER_ID;                    // 결제자 고유 ID (빌링키)
                data.PCD_PAYER_NAME = params.PCD_PAYER_NAME;                // 결제자 이름
                data.PCD_PAYER_HP = params.PCD_PAYER_HP;                    // 결제자 휴대전화번호
                data.PCD_PAYER_EMAIL = params.PCD_PAYER_EMAIL;              // 결제자 이메일
                data.PCD_PAY_GOODS = params.PCD_PAY_GOODS;                  // 상품명
                data.PCD_PAY_TOTAL = params.PCD_PAY_TOTAL;                  // 결제요청금액
                data.PCD_PAY_TAXTOTAL = params.PCD_PAY_TAXTOTAL;            // 부가세(복합과세 적용 시)
                data.PCD_PAY_ISTAX = params.PCD_PAY_ISTAX;                  // 과세여부
                data.PCD_PAY_TIME = "";                                     // 결제완료 시간
                data.PCD_PAY_CARDNAME = "";                                 // 카드사명
                data.PCD_PAY_CARDNUM = "";                                  // 카드번호
                data.PCD_PAY_CARDTRADENUM = "";                             // 카드 거래번호
                data.PCD_PAY_CARDAUTHNO = "";                               // 카드 승인번호
                data.PCD_PAY_CARDRECEIPT = "";                              // 카드 매출전표 URL
                data.PCD_SIMPLE_FLAG = "Y";                                 // 간편결제 여부 (Y|N)
            }
            res.json(data);
        }).catch(err => console.error(err));
    });
});


/*
 * POST /paySimpleSend, 계좌 정기결제 재결제
 */
router.post('/paySimpleSend', (req, res) => {
    // 파트너인증 요청변수: PCD_SIMPLE_FLAG
    post(process.env.HOSTNAME + '/node/auth', {PCD_SIMPLE_FLAG: 'Y'}).then(auth => {
        const payReqURL = auth.data.return_url;                         // 카드 정기결제 재결제 URL
        const params = {
            PCD_CST_ID: auth.data.cst_id,                               // 리턴 받은 cst_id Token
            PCD_CUST_KEY: auth.data.custKey,                            // 리턴 받은 custKey Token
            PCD_AUTH_KEY: auth.data.AuthKey,                            // 리턴 받은 AuthKey Token
            PCD_PAY_TYPE: 'transfer',                                   // (필수) 결제수단 (transfer)
            PCD_PAYER_ID: req.body.PCD_PAYER_ID || '',                  // (필수) 결제자 고유 ID (빌링키)
            PCD_PAY_GOODS: req.body.PCD_PAY_GOODS || '',                // (필수) 상품명
            PCD_SIMPLE_FLAG: 'Y',                                       // 간편결제 여부 (Y|N)
            PCD_PAY_TOTAL: req.body.PCD_PAY_TOTAL || '',                // (필수) 결제요청금액
            PCD_PAY_OID: req.body.PCD_PAY_OID || '',                    // 주문번호
            PCD_PAYER_NO: req.body.PCD_PAYER_NO || '',                  // 결제자 고유번호 (파트너사 회원 회원번호)
            PCD_PAYER_NAME: req.body.PCD_PAYER_NAME || '',              // 결제자 이름
            PCD_PAYER_HP: req.body.PCD_PAYER_HP || '' || '',            // 결제자 휴대전화번호
            PCD_PAYER_EMAIL: req.body.PCD_PAYER_EMAIL || '',            // 결제자 이메일
            PCD_PAY_ISTAX: req.body.PCD_PAY_ISTAX || 'Y',               // 과세여부
            PCD_PAY_TAXTOTAL: req.body.PCD_PAY_TAXTOTAL || '',          // 부가세(복합과세 적용 시)
            PCD_TAXSAVE_FLAG: req.body.PCD_TAXSAVE_FLAG || '',          // 현금영수증 발행 Y|N
            PCD_TAXSAVE_TRADE: req.body.PCD_TAXSAVE_TRADE || '',        // 현금영수증 발행 타입 (personal:소득공제 | company:지출증빙)
            PCD_TAXSAVE_IDNUM: req.body.PCD_TAXSAVE_IDNUM || '',        // 현금영수증 발행대상 번호
        }
        post(payReqURL, JSON.stringify(params), {
            headers: {
                'content-type': 'application/json',
                'referer': process.env.PCD_HTTP_REFERER
            }
        }).then(response => {
            const returned = response.data;
            const data = {};
            if (returned.PCD_PAY_RST !== '') {
                data.PCD_PAY_RST = returned.PCD_PAY_RST;                    // 요청 결과 (success | error)
                data.PCD_PAY_CODE = returned.PCD_PAY_CODE;                  // 요청 결과 코드
                data.PCD_PAY_MSG = returned.PCD_PAY_MSG;                    // 요청 결과 메시지
                data.PCD_PAY_OID = returned.PCD_PAY_OID;                    // 주문번호
                data.PCD_PAY_TYPE = returned.PCD_PAY_TYPE;                  // 결제수단 (card)
                data.PCD_PAYER_NO = returned.PCD_PAYER_NO;                  // 결제자 고유번호 (파트너사 회원 회원번호)
                data.PCD_PAYER_ID = returned.PCD_PAYER_ID;                  // 결제자 고유 ID (빌링키)
                data.PCD_PAYER_NAME = returned.PCD_PAYER_NAME;              // 결제자 이름
                data.PCD_PAYER_HP = returned.PCD_PAYER_HP;                  // 결제자 휴대전화번호
                data.PCD_PAYER_EMAIL = returned.PCD_PAYER_EMAIL;            // 결제자 이메일
                data.PCD_PAY_GOODS = returned.PCD_PAY_GOODS;                // 상품명
                data.PCD_PAY_TOTAL = returned.PCD_PAY_TOTAL;                // 결제요청금액
                data.PCD_PAY_TAXTOTAL = returned.PCD_PAY_TAXTOTAL;          // 부가세(복합과세 적용 시)
                data.PCD_PAY_ISTAX = returned.PCD_PAY_ISTAX;                // 과세여부
                data.PCD_PAY_TIME = returned.PCD_PAY_TIME;                  // 결제완료 시간
                data.PCD_PAY_BANK = returned.PCD_PAY_BANK;                  // 은행코드
                data.PCD_PAY_BANKNAME = returned.PCD_PAY_BANKNAME;          // 은행명
                data.PCD_PAY_BANKNUM = returned.PCD_PAY_BANKNUM;            // 계좌번호
                data.PCD_TAXSAVE_FLAG = returned.PCD_TAXSAVE_FLAG;          // 현금영수증 발행요청 (Y|N)
                data.PCD_TAXSAVE_RST = returned.PCD_TAXSAVE_RST;            // 현금영수증 발행결과 (Y|N)
                data.PCD_TAXSAVE_MGTNUM = returned.PCD_TAXSAVE_MGTNUM;      // 현금영수증 발행된 국세청 발행번호
                data.PCD_SIMPLE_FLAG = returned.PCD_SIMPLE_FLAG;            // 간편결제 여부 (Y|N)
            } else {
                data.PCD_PAY_RST = "error";                                 // 요청 결과 (success | error)
                data.PCD_PAY_CODE = "";                                     // 요청 결과 코드
                data.PCD_PAY_MSG = "출금요청실패";                             // 요청 결과 메시지
                data.PCD_PAY_OID = params.PCD_PAY_OID;                      // 주문번호
                data.PCD_PAY_TYPE = params.PCD_PAY_TYPE;                    // 결제수단 (transfer)
                data.PCD_PAYER_NO = params.PCD_PAYER_NO;                    // 결제자 고유번호 (파트너사 회원 회원번호)
                data.PCD_PAYER_ID = params.PCD_PAYER_ID;                    // 결제자 고유 ID (빌링키)
                data.PCD_PAYER_NAME = params.PCD_PAYER_NAME;                // 결제자 이름
                data.PCD_PAYER_HP = params.PCD_PAYER_HP;                    // 결제자 휴대전화번호
                data.PCD_PAYER_EMAIL = params.PCD_PAYER_EMAIL;              // 결제자 이메일
                data.PCD_PAY_GOODS = params.PCD_PAY_GOODS;                  // 상품명
                data.PCD_PAY_TOTAL = params.PCD_PAY_TOTAL;                  // 결제요청금액
                data.PCD_PAY_TAXTOTAL = params.PCD_PAY_TAXTOTAL;            // 부가세(복합과세 적용 시)
                data.PCD_PAY_ISTAX = params.PCD_PAY_ISTAX;                  // 과세여부
                data.PCD_PAY_BANK = "";                                     // 은행코드
                data.PCD_PAY_BANKNAME = "";                                 // 은행명
                data.PCD_PAY_BANKNUM = "";                                  // 계좌번호
                data.PCD_PAY_TIME = "";                                     // 결제완료 시간
                data.PCD_TAXSAVE_FLAG = "";                                 // 현금영수증 발행요청 (Y|N)
                data.PCD_TAXSAVE_RST = "N";                                 // 현금영수증 발행결과 (Y|N)
                data.PCD_TAXSAVE_MGTNUM = "";                               // 현금영수증 발행된 국세청 발행번호
            }
            res.json(data);
        }).catch(err => console.error(err));
    });
});

/*
 * POST /linkReg, URL링크결제 생성
 */
router.post('/linkReg', (req, res) => {
    // 파트너인증 요청변수: PCD_PAY_WORK
    post(process.env.HOSTNAME + '/node/auth', {PCD_PAY_WORK: 'LINKREG'}).then(auth => {
        const transferURL = auth.data.return_url;                       // 리턴 받은 결제결과 요청 URL
        const params = {
            PCD_CST_ID: auth.data.cst_id,                               // 리턴 받은 cst_id Token
            PCD_CUST_KEY: auth.data.custKey,                            // 리턴 받은 custKey Token
            PCD_AUTH_KEY: auth.data.AuthKey,                            // 리턴 받은 AuthKey Token
            PCD_PAY_WORK: 'LINKREG',                                    // (필수) 요청 작업 구분 (URL링크결제 : LINKREG)
            PCD_PAY_TYPE: req.body.PCD_PAY_TYPE || 'transfer',          // (필수) 결제수단 (transfer | card)
            PCD_PAY_GOODS: req.body.PCD_PAY_GOODS || '',                // (필수) 상품명
            PCD_PAY_TOTAL: req.body.PCD_PAY_TOTAL || '',                // (필수) 결제요청금액
            PCD_CARD_VER: req.body.PCD_CARD_VER || '',                  // 결제수단
            PCD_PAY_ISTAX: req.body.PCD_PAY_ISTAX || 'Y',               // 과세여부
            PCD_PAY_TAXTOTAL: req.body.PCD_PAY_TAXTOTAL || '',          // 부가세(복합과세 적용 시)
            PCD_TAXSAVE_FLAG: req.body.PCD_TAXSAVE_FLAG || '',          // 현금영수증 발행요청 (Y|N)
            PCD_LINK_EXPIREDATE: req.body.PCD_LINK_EXPIREDATE || '',    // URL 결제 만료일
        }
        post(transferURL, JSON.stringify(params), {
            headers: {
                'content-type': 'application/json',
                'referer': process.env.PCD_HTTP_REFERER
            }
        }).then(response => {
            const returned = response.data;
            const data = {};
            if (returned.PCD_LINK_RST !== '') {
                data.PCD_LINK_RST = returned.PCD_LINK_RST;                     // 요청 결과 (success)
                data.PCD_LINK_MSG = returned.PCD_LINK_MSG;                     // 요청 결과 메세지
                data.PCD_PAY_TYPE = params.PCD_PAY_TYPE;                       // 결제수단 (transfer | card)
                data.PCD_PAY_GOODS = returned.PCD_PAY_GOODS;                   // 상품명
                data.PCD_PAY_TYPE = returned.PCD_PAY_TYPE;                     // 결제수단
                data.PCD_PAY_TOTAL = returned.PCD_PAY_TOTAL;                   // 결제요청금액
                data.PCD_PAY_ISTAX = returned.PCD_PAY_ISTAX;                   // 과세여부
                data.PCD_PAY_TAXTOTAL = returned.PCD_PAY_TAXTOTAL;             // 부가세(복합과세 적용 시)
                data.PCD_TAXSAVE_FLAG = returned.PCD_TAXSAVE_FLAG;             // 현금영수증 발행요청 (Y|N)
                data.PCD_LINK_EXPIREDATE = returned.PCD_LINK_EXPIREDATE;       // URL 결제 만료일
                data.PCD_LINK_KEY = returned.PCD_LINK_KEY;                     // 링크요청 키
                data.PCD_LINK_URL = returned.PCD_LINK_URL;                     // 링크결제 URL
                data.PCD_LINK_MEMO = returned.PCD_LINK_MEMO;                   // 링크결제 메모
                if (returned.PCD_PAY_TYPE === 'card') data.PCD_CARD_VER = returned.PCD_CARD_VER // 카드 세부 결제 방식
            } else {
                data.PCD_LINK_RST = "error";                	        	   // 요청 결과 (error)
                data.PCD_PAY_TYPE = params.PCD_PAY_TYPE;                       // 결제수단 (transfer | card)
                data.PCD_LINK_MSG = "요청결과 수신 실패";                           // 요청 결과 메세지
                data.PCD_PAY_GOODS = "";                		        	   // 상품명
                data.PCD_PAY_TOTAL = "";                		        	   // 결제요청금액
                data.PCD_LINK_URL = "";             			               // 현금영수증 발행요청 (Y|N)
                data.PCD_LINK_MEMO = "";                		        	   // 링크결제 URL
            }
            res.json(data);
        }).catch(err => console.error(err));
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
