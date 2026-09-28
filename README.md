# Localiza Docs — Sede BH

Sistema de amostra para **encontrar documentos físicos dentro da empresa**, usando como base a sede da Localiza em:

**Av. Bernardo Vasconcelos, 377 — Cachoeirinha — Belo Horizonte/MG**

## Ideia

| Na agência Localiza | Neste sistema |
| --- | --- |
| Onde está o carro? | Em qual **cômodo** está o documento? |
| Vaga / pátio | Prateleira + caixa |
| Como chegar à agência | Como chegar à sala no prédio |

Exemplo de resposta:

> O contrato `CTR-2024-0187` **está na Sala Jurídica**, 2º andar, prateleira **J-04**, caixa **12**.  
> Como chegar: Elevador B → 2º andar → ala leste → porta “Jurídico / Contratos”.

## Cômodos da amostra

Recepção, Atendimento, Comercial, Jurídico, Compliance, Financeiro, RH, Arquivo Ativo, Arquivo Morto, Cofre, Sala de Reunião Norte.

## Como rodar

```bash
cd C:\Users\huyda\projetothalita\localiza-docs
npm install
npm run dev
```

Abra `http://127.0.0.1:5173/`.
