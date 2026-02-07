# 📊 Guia de Configuração do Google Tag Manager

## ✅ O que já está feito no código

Os eventos estão sendo enviados para o `dataLayer` do GTM. Você pode verificar no console do navegador (F12) que os eventos aparecem com `console.log('GTM Event:', ...)`.

## 🔧 O que você precisa fazer no Google Tag Manager

### 1. Acesse o Google Tag Manager
- Vá para: https://tagmanager.google.com
- Selecione seu container: **GTM-M72RRSP8**

### 2. Configure as Tags para capturar os eventos

#### **Tag 1: Evento de Checkout Step**
1. Vá em **Tags** > **Nova**
2. Nome: `Event - Checkout Step`
3. Tipo de Tag: **Google Analytics: GA4 Event** (ou **Evento Personalizado**)
4. **Trigger**: 
   - Tipo: **Evento Personalizado**
   - Nome do Evento: `checkout_step`
5. **Variáveis** (se usar GA4):
   - `step_number` → `{{step_number}}`
   - `step_name` → `{{step_name}}`
   - `plan_name` → `{{plan_name}}`
   - `plan_value` → `{{plan_value}}`

#### **Tag 2: Seleção de Plano**
1. Nome: `Event - Select Plan`
2. Tipo: **Evento Personalizado**
3. **Trigger**: 
   - Nome do Evento: `select_plan`
4. **Variáveis**:
   - `plan_name` → `{{plan_name}}`
   - `plan_id` → `{{plan_id}}`
   - `value` → `{{value}}`
   - `currency` → `{{currency}}`

#### **Tag 3: Conversão/Purchase**
1. Nome: `Event - Purchase`
2. Tipo: **Google Analytics: GA4 Event** (tipo: `purchase`)
3. **Trigger**: 
   - Nome do Evento: `purchase`
4. **Variáveis**:
   - `transaction_id` → `{{transaction_id}}`
   - `value` → `{{value}}`
   - `currency` → `{{currency}}`
   - `items` → `{{items}}`

#### **Tag 4: Clique em Botão**
1. Nome: `Event - Button Click`
2. Tipo: **Evento Personalizado**
3. **Trigger**: 
   - Nome do Evento: `button_click`
4. **Variáveis**:
   - `button_name` → `{{button_name}}`
   - `location` → `{{location}}`

#### **Tag 5: Submissão de Formulário**
1. Nome: `Event - Form Submit`
2. Tipo: **Evento Personalizado**
3. **Trigger**: 
   - Nome do Evento: `form_submit`
4. **Variáveis**:
   - `form_type` → `{{form_type}}`
   - `plano` → `{{plano}}`
   - `origem` → `{{origem}}`

#### **Tag 6: Geração de Lead**
1. Nome: `Event - Generate Lead`
2. Tipo: **Google Analytics: GA4 Event** (tipo: `generate_lead`)
3. **Trigger**: 
   - Nome do Evento: `generate_lead`
4. **Variáveis**:
   - `form_type` → `{{form_type}}`
   - `plano` → `{{plano}}`

#### **Tag 7: Seleção de Conteúdo**
1. Nome: `Event - Select Content`
2. Tipo: **Evento Personalizado**
3. **Trigger**: 
   - Nome do Evento: `select_content`
4. **Variáveis**:
   - `content_type` → `{{content_type}}`
   - `content_id` → `{{content_id}}`
   - `content_name` → `{{content_name}}`

### 3. Configure as Variáveis do DataLayer

1. Vá em **Variáveis** > **Nova**
2. Para cada variável que você usar nas tags, crie uma variável do tipo **Data Layer Variable**
3. Exemplos:
   - Nome: `step_number` → Nome da Variável do Data Layer: `step_number`
   - Nome: `plan_name` → Nome da Variável do Data Layer: `plan_name`
   - E assim por diante...

### 4. Teste no Modo Preview

1. Clique em **Preview** no GTM
2. Digite a URL do seu site
3. Execute as ações (clicar em botões, preencher formulários, etc.)
4. No painel do Preview, você verá os eventos sendo disparados

### 5. Publique as Tags

Após testar, clique em **Enviar** para publicar as alterações.

## 📋 Lista de Eventos Enviados

| Evento | Quando é Disparado | Parâmetros |
|--------|-------------------|------------|
| `checkout_step` | Mudança de etapa no checkout | `step_number`, `step_name`, `plan_name`, `plan_value` |
| `select_plan` | Seleção de um plano | `plan_name`, `plan_id`, `value`, `currency` |
| `purchase` | Pagamento confirmado | `transaction_id`, `value`, `currency`, `items` |
| `conversion` | Conversão (pagamento) | `conversion_type`, `value`, `currency` |
| `button_click` | Clique em botões importantes | `button_name`, `location` |
| `form_submit` | Submissão de formulário | `form_type`, `plano`, `origem` |
| `generate_lead` | Geração de lead | `form_type`, `plano` |
| `select_content` | Seleção de conteúdo (plano) | `content_type`, `content_id`, `content_name` |

## 🔍 Como Verificar se os Eventos Estão Sendo Enviados

1. Abra o console do navegador (F12)
2. Vá na aba **Console**
3. Execute as ações no site
4. Você verá logs como: `GTM Event: {event: 'checkout_step', ...}`
5. Vá na aba **Network** e filtre por `gtm.js` ou `collect` para ver as requisições

## ⚠️ Importante

- Os eventos só aparecerão no Google Analytics se você configurar as tags no GTM
- Use o modo Preview do GTM para testar antes de publicar
- Certifique-se de que o Google Analytics está conectado ao GTM

