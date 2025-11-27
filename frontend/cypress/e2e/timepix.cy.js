describe("Fluxo Completo TimePIX", () => {
  // Dados dinâmicos para evitar conflito de usuário já existente
  const timestamp = Date.now();
  const usuario = {
    nome: "Cypress",
    sobrenome: "Test",
    email: `teste${timestamp}@ufla.br`, // Backend exige domínio @ufla.br
    telefone: "(35) 9 9999-9999",
    senha: "senhaForte123",
  };

  const servico = {
    nome: `Aula de Cypress ${timestamp}`,
    descricao: "Ensinando automação de testes E2E",
    valor: "2",
  };

  it("Deve registrar um novo usuário com sucesso", () => {
    cy.visit("/registro");

    // Preenche o formulário (baseado nos Labels dos Inputs no PaginaRegistro.jsx)
    cy.contains("label", "Nome").parent().find("input").type(usuario.nome);
    cy.contains("label", "Sobrenome")
      .parent()
      .find("input")
      .type(usuario.sobrenome);
    cy.contains("label", "Telefone")
      .parent()
      .find("input")
      .type(usuario.telefone);
    cy.contains("label", "E-mail").parent().find("input").type(usuario.email);
    cy.contains("label", "Senha").parent().find("input").type(usuario.senha);

    // Stub do window.alert para verificar a mensagem de sucesso
    const stub = cy.stub();
    cy.on("window:alert", stub);

    cy.contains("button", "Registrar-se").click();

    // Verifica se o alerta foi chamado com a mensagem correta
    cy.waitUntil(() =>
      stub.calledWith("Registro realizado! Faça login.").then(() => {
        expect(stub.getCall(0)).to.be.calledWith(
          "Registro realizado! Faça login."
        );
      })
    );

    // Verifica redirecionamento para login
    cy.url().should("include", "/login");
  });

  it("Deve realizar login com o usuário criado", () => {
    cy.visit("/login");

    cy.contains("label", "E-mail").parent().find("input").type(usuario.email);
    cy.contains("label", "Senha").parent().find("input").type(usuario.senha);

    cy.contains("button", "Entrar").click();

    // PaginaLogin redireciona para /busca ao logar
    cy.url().should("include", "/busca");

    // Verifica se os botões da Sidebar aparecem (indica login sucesso)
    cy.contains("Visualizar Perfil").should("be.visible");
  });

  it("Deve verificar o saldo inicial no Dashboard", () => {
    // Preserva a sessão (cookies) entre os testes se necessário,
    // mas aqui estamos fazendo login via UI novamente para garantir o estado
    cy.loginUI(usuario.email, usuario.senha);

    cy.visit("/dashboard");

    // O backend define saldo padrão como 4
    cy.contains("Saldo Disponível").parent().should("contain", "4h");
  });

  it("Deve adicionar um novo serviço", () => {
    cy.loginUI(usuario.email, usuario.senha);

    cy.visit("/perfil");
    cy.contains("button", "Adicionar Novo").click();

    cy.url().should("include", "/servico/novo");

    // Preenche formulário de serviço
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

    // Deve voltar para o perfil
    cy.url().should("include", "/perfil");

    // Verifica se o serviço aparece na lista
    cy.contains(servico.nome).should("be.visible");
    cy.contains(`${servico.valor}h`).should("be.visible");
  });

  it("Deve aparecer na busca para outros usuários", () => {
    cy.loginUI(usuario.email, usuario.senha);
    cy.visit("/busca");

    // Digita o nome do serviço na busca
    cy.get('input[placeholder="Busque por serviço ou nome..."]').type(
      servico.nome
    );
    cy.contains("button", "Buscar").click();

    // Verifica se o card de resultado aparece
    cy.contains(servico.nome).should("be.visible");
    cy.contains(usuario.nome).should("be.visible"); // Nome do dono
  });

  it("Deve realizar logout", () => {
    cy.loginUI(usuario.email, usuario.senha);
    cy.visit("/busca");

    cy.contains("button", "Sair").click();

    // Verifica redirecionamento para login e limpeza de estado
    cy.url().should("include", "/login");
  });
});

// Comando customizado para facilitar o login repetitivo
Cypress.Commands.add("loginUI", (email, senha) => {
  cy.session([email, senha], () => {
    cy.visit("/login");
    cy.contains("label", "E-mail").parent().find("input").type(email);
    cy.contains("label", "Senha").parent().find("input").type(senha);
    cy.contains("button", "Entrar").click();
    cy.url().should("include", "/busca");
  });
});
