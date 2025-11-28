describe("Fluxo Completo TimePIX", () => {
  const timestamp = Date.now();

  // Utilizador 1: Apenas para testar o registo manual pela interface
  const usuarioRegistro = {
    nome: "Novo",
    sobrenome: "Registro",
    email: `registro${timestamp}@ufla.br`,
    telefone: "(35) 9 1111-1111",
    senha: "senha123",
  };

  // Utilizador 2: REMETENTE (Quem vai fazer login e transferir saldo)
  const usuarioLogin = {
    nome: "Cypress",
    sobrenome: "Remetente",
    email: `remetente${timestamp}@ufla.br`,
    telefone: "(35) 9 2222-2222",
    senha: "senhaForte123",
  };

  // Utilizador 3: DESTINATÁRIO (Quem vai receber o saldo)
  const usuarioDestino = {
    nome: "Cypress",
    sobrenome: "Destino",
    email: `destino${timestamp}@ufla.br`,
    telefone: "(35) 9 3333-3333",
    senha: "senhaForte123",
  };

  const servico = {
    nome: `Aula Cypress ${timestamp}`,
    descricao: "Teste automatizado",
    valor: "2",
  };

  // SETUP: Cria os utilizadores necessários no Backend antes dos testes
  before(() => {
    // 1. Cria o Remetente (ignora se já existir)
    cy.request({
      method: "POST",
      url: "http://localhost:8080/api/register",
      body: usuarioLogin,
      failOnStatusCode: false,
    });

    // 2. Cria o Destinatário (essencial para a transferência funcionar)
    cy.request({
      method: "POST",
      url: "http://localhost:8080/api/register",
      body: usuarioDestino,
      failOnStatusCode: false,
    });
  });

  it("Deve registrar um novo usuário pela interface", () => {
    cy.visit("/registro");

    cy.contains("label", "Nome")
      .parent()
      .find("input")
      .type(usuarioRegistro.nome);
    cy.contains("label", "Sobrenome")
      .parent()
      .find("input")
      .type(usuarioRegistro.sobrenome);
    cy.contains("label", "Telefone")
      .parent()
      .find("input")
      .type(usuarioRegistro.telefone);
    cy.contains("label", "E-mail")
      .parent()
      .find("input")
      .type(usuarioRegistro.email);
    cy.contains("label", "Senha")
      .parent()
      .find("input")
      .type(usuarioRegistro.senha);

    const stub = cy.stub();
    cy.on("window:alert", stub);

    cy.contains("button", "Registrar-se").click();

    cy.wrap(stub).should(
      "have.been.calledWith",
      "Registro realizado! Faça login."
    );
    cy.url().should("include", "/login");
  });

  it("Deve realizar login com sucesso", () => {
    cy.loginUI(usuarioLogin.email, usuarioLogin.senha);
    cy.contains("Visualizar Perfil").should("be.visible");
  });

  it("Deve verificar o saldo inicial no Dashboard", () => {
    cy.intercept("GET", "**/api/users/me").as("getUser");
    cy.loginUI(usuarioLogin.email, usuarioLogin.senha);

    cy.visit("/dashboard");
    cy.wait("@getUser");

    // Saldo inicial padrão é 4h
    cy.contains("4h").should("be.visible");
  });

  it("Deve realizar uma transferência de 1h para outro usuário", () => {
    // Interceptamos a requisição de transferência e a atualização do usuário
    cy.intercept("POST", "**/api/transactions").as("postTransaction");
    cy.intercept("GET", "**/api/users/me").as("getUser");

    cy.loginUI(usuarioLogin.email, usuarioLogin.senha);
    cy.visit("/dashboard");

    // Espera carregar o saldo inicial
    cy.wait("@getUser");

    // Preenche o formulário de transferência
    cy.contains("label", "E-mail do Destinatário")
      .parent()
      .find("input")
      .type(usuarioDestino.email);
    cy.contains("label", "Valor (horas)").parent().find("input").type("1");

    const stub = cy.stub();
    cy.on("window:alert", stub);

    cy.contains("button", "Transferir").click();

    // Aguarda a resposta da API de transferência
    cy.wait("@postTransaction").its("response.statusCode").should("eq", 202);

    // Verifica o alerta
    cy.wrap(stub).should(
      "have.been.calledWith",
      "Transferência enviada com sucesso!"
    );

    // Aguarda a atualização automática do saldo no Dashboard
    cy.wait("@getUser");

    // Verifica se o saldo caiu de 4h para 3h
    cy.contains("3h").should("be.visible");
  });

  it("Deve adicionar um novo serviço", () => {
    cy.loginUI(usuarioLogin.email, usuarioLogin.senha);
    cy.visit("/servico/novo");

    cy.contains("h1", "Adicionar Serviço").should("be.visible");

    cy.contains("label", "Nome").parent().find("input").type(servico.nome);
    cy.contains("label", "Descrição")
      .parent()
      .find("input")
      .type(servico.descricao);
    cy.contains("label", "Valor (em horas)")
      .parent()
      .find("input")
      .type(servico.valor);

    cy.contains("button", "Salvar").click();

    cy.url().should("include", "/perfil");
    cy.contains(servico.nome).should("be.visible");
  });

  it("Deve realizar logout", () => {
    cy.loginUI(usuarioLogin.email, usuarioLogin.senha);
    cy.visit("/busca");

    cy.contains("button", "Sair").click();
    cy.url().should("include", "/login");
  });
});

// COMANDO CUSTOMIZADO DE LOGIN (ROBUSTO)
Cypress.Commands.add("loginUI", (email, senha) => {
  // Monitoriza a requisição de login
  cy.intercept("POST", "**/api/login").as("loginRequest");

  cy.visit("/login");

  // Garante que os campos foram preenchidos corretamente
  cy.contains("label", "E-mail")
    .parent()
    .find("input")
    .type(email)
    .should("have.value", email);
  cy.contains("label", "Senha")
    .parent()
    .find("input")
    .type(senha)
    .should("have.value", senha);

  cy.contains("button", "Entrar").click();

  // Espera explicitamente a API responder "200 OK" antes de continuar
  cy.wait("@loginRequest", { timeout: 15000 }).then((interception) => {
    expect(interception.response.statusCode).to.eq(
      200,
      "Falha no login da API"
    );
  });

  cy.url().should("include", "/busca");
});
