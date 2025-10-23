# payple-sample-node.js

🏠[페이플 홈페이지](https://www.payple.kr/)<br>
페이플 결제 서비스는 간편결제, 정기결제와 같은 <br>
새로운 비즈니스모델과 서비스를 지원하기 위해 다양한 결제방식을 제공합니다.
<br><br>

## Update (2025.10.20)
파트너 인증 관련 코드를 분리하여 가독성을 높였습니다.<br>
간편페이 연동 체크리스트를 반영했습니다.<br>
🙋‍ [간편페이 연동 체크리스트](https://developer.payple.kr/preparation/easypay-integration) 보러가기
<br><br>


## Update (2023.07.06)
결제창 호출 요청 전 프로세스인 파트너 인증 방식이 새롭게 변경되어 코드에 반영되었습니다!<br>
이제 클라이언트 단에서 키 값 하나로(clientKey) 더 빠르고 쉬운 파트너 인증을 통한 결제창 호출을 할 수 있습니다.🧑‍💻
<br><br>


## Documentation

📂 /sample_nodejs/**.env.json** 계정 관리 파일
#### 결제연동
>📂 **/node/order &nbsp;:** &nbsp;상품 주문<br>
>📂 **/node/order_confirm &nbsp;:** &nbsp;주문확정 및 결제<br>
>📂 **/node/order_result &nbsp;:** &nbsp;결제결과<br>
#### 기타 API
>📂 **/node/linkReg &nbsp;:** &nbsp;URL링크결제<br> 
>📂 **/node/payCertSend &nbsp;:** &nbsp;결제요청 재컨펌(CERT) 방식<br>
>📂 **/node/payInfo &nbsp;:** &nbsp;결제결과 조회<br> 
>📂 **/node/payRefund &nbsp;:** &nbsp;결제취소<br>
>📂 **/node/paySimpleCardSend &nbsp;:** &nbsp;카드 정기결제 재결제<br>
>📂 **/node/paySimpleSend &nbsp;:** &nbsp;계좌 정기결제 재결제<br>
>📂 **/node/payUserDel &nbsp;:** &nbsp;등록해지<br>
>📂 **/node/payUserInfo &nbsp;:** &nbsp;등록조회<br>
>📂 **/node/taxSaveReq &nbsp;:** &nbsp;현금영수증 발행/취소<br>
<br>

🙋‍ [페이플 API](https://developer.payple.kr) 보러가기

