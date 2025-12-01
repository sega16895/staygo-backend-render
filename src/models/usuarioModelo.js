const sql = require("mssql");
const dbConfig = require("../config/db");

async function crearUsuario(datosUsuario) {
  try {
    const pool = await sql.connect(dbConfig);
    const resultado = await pool
      .request()
      .input("Nombre", sql.NVarChar, datosUsuario.Nombre)
      .input("Email", sql.NVarChar, datosUsuario.Email)
      .input("ClaveHash", sql.NVarChar, datosUsuario.ClaveHash)
      .input("TipoLogueo", sql.NVarChar, datosUsuario.TipoLogueo)
      .input("FechaNacimiento", sql.Date, datosUsuario.FechaNacimiento || null)
      .input("IdPais", sql.Int, datosUsuario.IdPais || null)
      .input("IdProvincia", sql.Int, datosUsuario.IdProvincia || null)
      .input("IdCanton", sql.Int, datosUsuario.IdCanton || null)
      .input("IdDestino", sql.Int, datosUsuario.IdDestino || null)
      .execute("sp_CrearUsuario");

    return resultado.recordset[0];
  } catch (error) {
    throw new Error("Error al crear usuario: " + error.message);
  }
}

async function buscarUsuarioPorCorreo(email) {
  try {
    const pool = await sql.connect(dbConfig);
    const resultado = await pool
      .request()
      .input("Email", sql.NVarChar, email)
      .execute("sp_BuscarUsuarioPorCorreo");

    return resultado.recordset[0];
  } catch (error) {
    throw new Error("Error al buscar usuario: " + error.message);
  }
}

async function obtenerUsuarioPorId(idUsuario) {
  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool.request()
      .input("IdUsuario", sql.Int, idUsuario)
      .query(`
        SELECT 
          U.IdUsuario,
          U.Nombre,
          U.Email,
          U.FechaNacimiento,
          U.IdPais,
          U.IdProvincia,
          U.IdCanton,
          U.IdDistrito,
          U.IdDestino,
          U.DocumentoIdentidad,
          U.DireccionFacturacion,
          U.CodigoPostal,
          U.MetodoPagoPreferido,
          U.TwoFactorSecret,          
          U.CodigoRecuperacion,      
          U.ExpiraCodigo,         
          P.Nombre AS Pais,
          PR.Nombre AS Provincia,
          C.Nombre AS Canton,
          DI.Nombre AS Distrito,
          D.Nombre AS DestinoFavorito
        FROM Usuarios U
        LEFT JOIN Paises P ON U.IdPais = P.IdPais
        LEFT JOIN Provincias PR ON U.IdProvincia = PR.IdProvincia
        LEFT JOIN Cantones C ON U.IdCanton = C.IdCanton
        LEFT JOIN Distritos DI ON U.IdDistrito = DI.IdDistrito
        LEFT JOIN DestinosFavoritos D ON U.IdDestino = D.IdDestino
        WHERE U.IdUsuario = @IdUsuario
      `);
    return result.recordset[0] || null;
  } catch (error) {
    throw new Error("Error al obtener usuario: " + error.message);
  }
}

async function actualizarUsuario(datosUsuario) {
  try {
    const pool = await sql.connect(dbConfig);
    const resultado = await pool.request()
      .input("IdUsuario", sql.Int, datosUsuario.IdUsuario)
      .input("Nombre", sql.NVarChar, datosUsuario.Nombre)
      .input("Email", sql.NVarChar, datosUsuario.Email)
      .input("FechaNacimiento", sql.Date, datosUsuario.FechaNacimiento || null)
      .input("IdPais", sql.Int, datosUsuario.IdPais || null)
      .input("IdProvincia", sql.Int, datosUsuario.IdProvincia || null)
      .input("IdCanton", sql.Int, datosUsuario.IdCanton || null)
      .input("IdDistrito", sql.Int, datosUsuario.IdDistrito || null)
      .input("IdDestino", sql.Int, datosUsuario.IdDestino || null)
      .execute("sp_actualizarUsuario");

    return resultado.recordset[0];
  } catch (error) {
    throw new Error("Error al actualizar usuario: " + error.message);
  }
}

async function listarPaises() {
  const pool = await sql.connect(dbConfig);
  const result = await pool.request().execute("sp_ListarPaises");
  return result.recordset;
}

async function listarProvincias(idPais) {
  const pool = await sql.connect(dbConfig);
  const result = await pool
    .request()
    .input("IdPais", sql.Int, idPais)
    .execute("sp_ListarProvincias");
  return result.recordset;
}

async function listarCantones(idProvincia) {
  const pool = await sql.connect(dbConfig);
  const result = await pool
    .request()
    .input("IdProvincia", sql.Int, idProvincia)
    .execute("sp_ListarCantones");
  return result.recordset;
}

async function listarDestinosFavoritos() {
  const pool = await sql.connect(dbConfig);
  const result = await pool.request().execute("sp_ListarDestinosFavoritos");
  return result.recordset;
}

async function actualizarDatosPago(datos) {
  try {
    const pool = await sql.connect(dbConfig);
    const resultado = await pool.request()
      .input("IdUsuario", sql.Int, datos.IdUsuario)
      .input("DocumentoIdentidad", sql.NVarChar, datos.DocumentoIdentidad || null)
      .input("DireccionFacturacion", sql.NVarChar, datos.DireccionFacturacion || null)
      .input("CodigoPostal", sql.NVarChar, datos.CodigoPostal || null)
      .input("MetodoPagoPreferido", sql.NVarChar, datos.MetodoPagoPreferido || null)
      .input("IdClientePasarela", sql.NVarChar, datos.IdClientePasarela || null)
      .execute("sp_actualizarUsuarioPago");

    return resultado.recordset[0];
  } catch (error) {
    throw new Error("Error al actualizar datos de pago: " + error.message);
  }
}

async function obtenerDatosPago(idUsuario) {
  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool.request()
      .input("IdUsuario", sql.Int, idUsuario)
      .query(`
        SELECT 
          DocumentoIdentidad, 
          DireccionFacturacion, 
          CodigoPostal, 
          MetodoPagoPreferido, 
          IdClientePasarela, 
          EstadoCuenta
        FROM Usuarios WHERE IdUsuario = @IdUsuario
      `);
    return result.recordset[0] || null;
  } catch (error) {
    throw new Error("Error al obtener datos de pago: " + error.message);
  }
}

async function guardarTokenRecuperacion(IdUsuario, Token) {
  try {
    const pool = await sql.connect(dbConfig);
    await pool
      .request()
      .input("IdUsuario", sql.Int, IdUsuario)
      .input("Token", sql.NVarChar(sql.MAX), Token)
      .input("FechaExpiracion", sql.DateTime, new Date(Date.now() + 15 * 60000)) 
      .query(`
        UPDATE Usuarios
        SET TokenRecuperacion = @Token, ExpiraToken = @FechaExpiracion
        WHERE IdUsuario = @IdUsuario;
      `);
  } catch (error) {
    throw new Error("Error al guardar token de recuperación: " + error.message);
  }
}

async function actualizarClave(IdUsuario, ClaveHash) {
  try {
    const pool = await sql.connect(dbConfig);
    await pool
      .request()
      .input("IdUsuario", sql.Int, IdUsuario)
      .input("ClaveHash", sql.NVarChar(255), ClaveHash)
      .query(`
        UPDATE Usuarios
        SET ClaveHash = @ClaveHash,
            TokenRecuperacion = NULL,
            ExpiraToken = NULL
        WHERE IdUsuario = @IdUsuario;
      `);
  } catch (error) {
    throw new Error("Error al actualizar contraseña: " + error.message);
  }
}

async function buscarPorToken(token) {
  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool
      .request()
      .input("Token", sql.NVarChar(sql.MAX), token)
      .query(`
        SELECT IdUsuario, ExpiraToken 
        FROM Usuarios 
        WHERE TokenRecuperacion = @Token;
      `);
    return result.recordset[0];
  } catch (error) {
    throw new Error("Error al buscar token de recuperación: " + error.message);
  }
}

async function insertarLogSeguridad({
  Email,
  IP_Cliente = null,
  ResultadoRecaptcha = null,
  PuntajeRecaptcha = null,
  Exitoso = null,
  Mensaje = null,
}) {
  try {
    const pool = await sql.connect(dbConfig);
    await pool.request()
      .input("Email", sql.NVarChar, Email)
      .input("IP_Cliente", sql.NVarChar, IP_Cliente)
      .input("ResultadoRecaptcha", sql.Bit, ResultadoRecaptcha)
      .input("PuntajeRecaptcha", sql.Decimal(3, 2), PuntajeRecaptcha)
      .input("Exitoso", sql.Bit, Exitoso)
      .input("Mensaje", sql.NVarChar, Mensaje)
      .execute("sp_insertarLogSeguridad");

  } catch (error) {
    console.error("Error al insertar log de seguridad:", error.message);
  }
}

async function actualizarUltimoAcceso(IdUsuario) {
  try {
    const pool = await sql.connect(dbConfig);
    await pool.request()
      .input("IdUsuario", sql.Int, IdUsuario)
      .query(`
        UPDATE Usuarios 
        SET UltimoAcceso = GETDATE()
        WHERE IdUsuario = @IdUsuario;
      `);
  } catch (error) {
    console.error("Error al actualizar último acceso:", error.message);
  }
}

async function bloquearCuenta(IdUsuario) {
  try {
    const pool = await sql.connect(dbConfig);
    await pool.request()
      .input("IdUsuario", sql.Int, IdUsuario)
      .query(`
        UPDATE Usuarios 
        SET EstadoCuenta = 0
        WHERE IdUsuario = @IdUsuario;
      `);
  } catch (error) {
    console.error("Error al bloquear cuenta:", error.message);
  }
}

async function guardarSecreto2FA(IdUsuario, secretBase32) {
  try {
    const pool = await sql.connect(dbConfig);
    await pool
      .request()
      .input("IdUsuario", sql.Int, IdUsuario)
      .input("TwoFactorSecret", sql.NVarChar(100), secretBase32)
      .query(`
        UPDATE Usuarios
        SET TwoFactorSecret = @TwoFactorSecret
        WHERE IdUsuario = @IdUsuario
      `);
  } catch (error) {
    throw new Error("Error al guardar secreto 2FA: " + error.message);
  }
}

async function guardarCodigoRecuperacion(IdUsuario, Codigo) {
  try {
    const pool = await sql.connect(dbConfig);
    await pool.request()
      .input("IdUsuario", sql.Int, IdUsuario)
      .input("CodigoRecuperacion", sql.NVarChar(6), Codigo)
      .input("ExpiraCodigo", sql.DateTime, new Date(Date.now() + 10 * 60000)) 
      .query(`
        UPDATE Usuarios
        SET CodigoRecuperacion = @CodigoRecuperacion, ExpiraCodigo = @ExpiraCodigo
        WHERE IdUsuario = @IdUsuario;
      `);
  } catch (error) {
    throw new Error("Error al guardar código de recuperación: " + error.message);
  }
}

async function verificarCodigoRecuperacion(IdUsuario, Codigo) {
  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool.request()
      .input("IdUsuario", sql.Int, IdUsuario)
      .input("Codigo", sql.NVarChar(6), Codigo)
      .query(`
        SELECT IdUsuario 
        FROM Usuarios
        WHERE IdUsuario = @IdUsuario
        AND CodigoRecuperacion = @Codigo
        AND ExpiraCodigo > GETDATE();
      `);
    return result.recordset[0];
  } catch (error) {
    throw new Error("Error al verificar código: " + error.message);
  }
}

async function guardarTokenTemporal(IdUsuario, Token, ExpiraToken) {
  try {
    const pool = await sql.connect(dbConfig);
    await pool.request()
      .input("IdUsuario", sql.Int, IdUsuario)
      .input("Token", sql.NVarChar(sql.MAX), Token)
      .input("ExpiraToken", sql.DateTime, ExpiraToken)
      .query(`
        UPDATE Usuarios
        SET TokenRecuperacion = @Token, ExpiraToken = @ExpiraToken
        WHERE IdUsuario = @IdUsuario
      `);
  } catch (error) {
    throw new Error("Error al guardar token temporal: " + error.message);
  }
}

async function incrementarIntentosFallidos(IdUsuario, maxIntentos = 3, minutosBloqueo = 15) {
  try {
    const pool = await sql.connect(dbConfig);
    await pool.request()
      .input("IdUsuario", sql.Int, IdUsuario)
      .input("MaxIntentos", sql.Int, maxIntentos)
      .input("MinutosBloqueo", sql.Int, minutosBloqueo)
      .query(`
        UPDATE Usuarios
        SET IntentosFallidos = ISNULL(IntentosFallidos, 0) + 1,
            FechaBloqueo = CASE 
              WHEN ISNULL(IntentosFallidos,0) + 1 >= @MaxIntentos THEN DATEADD(MINUTE, @MinutosBloqueo, GETUTCDATE())  -- Cambia GETDATE() por GETUTCDATE()
              ELSE FechaBloqueo
            END
        WHERE IdUsuario = @IdUsuario;
      `);
  } catch (error) {
    throw new Error("Error al incrementar intentos: " + error.message);
  }
}

  async function reiniciarIntentosFallidos(IdUsuario) {
    try {
      const pool = await sql.connect(dbConfig);
      await pool.request()
        .input("IdUsuario", sql.Int, IdUsuario)
        .query(`
          UPDATE Usuarios
          SET IntentosFallidos = 0  -- Solo resetea intentos fallidos, deja FechaBloqueo intacta
          WHERE IdUsuario = @IdUsuario;
        `);
    } catch (error) {
      throw new Error("Error al reiniciar intentos: " + error.message);
    }
  }
  

async function obtenerEstadoBloqueo(IdUsuario) {
  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool.request()
      .input("IdUsuario", sql.Int, IdUsuario)
      .query(`
        SELECT IntentosFallidos, FechaBloqueo
        FROM Usuarios
        WHERE IdUsuario = @IdUsuario;
      `);
    return result.recordset[0] || null;
  } catch (error) {
    throw new Error("Error al obtener estado bloqueo: " + error.message);
  }
}

async function insertarAuditoria({
  idUsuario = null,
  accion,
  tabla = "Usuarios",
  registroId = null,
  descripcion = null,
  ip = null,
  navegador = null,
  exitoso = 1,
}) {
  try {
    const pool = await sql.connect(dbConfig);
    await pool.request()
      .input("IdUsuario", sql.Int, idUsuario)
      .input("Accion", sql.NVarChar(100), accion)
      .input("TablaAfectada", sql.NVarChar(100), tabla)
      .input("RegistroId", sql.Int, registroId)
      .input("Descripcion", sql.NVarChar(500), descripcion)
      .input("DireccionIP", sql.NVarChar(50), ip)
      .input("Navegador", sql.NVarChar(150), navegador)
      .input("Exitoso", sql.Bit, exitoso)
      .execute("sp_insertarAuditoria");
  } catch (error) {
    console.error("❌ Error insertando auditoría:", error.message);
  }
}

async function buscarUsuarioPorGoogleId(googleId) {
  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool.request()
      .input("GoogleId", sql.NVarChar(255), googleId)
      .query(`SELECT TOP 1 * FROM Usuarios WHERE GoogleId = @GoogleId`);
    return result.recordset[0] || null;
  } catch (error) {
    throw new Error("Error al buscar usuario por GoogleId: " + error.message);
  }
}

async function crearUsuarioGoogle(datos) {
  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool.request()
      .input("Nombre", sql.NVarChar, datos.Nombre)
      .input("Email", sql.NVarChar, datos.Email)
      .input("GoogleId", sql.NVarChar, datos.GoogleId)
      .input("FotoPerfil", sql.NVarChar, datos.FotoPerfil)
      .input("TipoLogueo", sql.NVarChar, "Google")
      .query(`
        INSERT INTO Usuarios (Nombre, Email, GoogleId, FotoPerfil, TipoLogueo, FechaRegistro, EstadoCuenta)
        VALUES (@Nombre, @Email, @GoogleId, @FotoPerfil, @TipoLogueo, GETDATE(), 1);
        SELECT SCOPE_IDENTITY() AS NuevoIdUsuario;
      `);
    return result.recordset[0];
  } catch (error) {
    throw new Error("Error al crear usuario Google: " + error.message);
  }
}

async function obtenerDistritos(idCanton) {
  const pool = await sql.connect(dbConfig);
  const result = await pool.request()
    .input('IdCanton', sql.Int, idCanton)
    .execute('sp_ObtenerDistritos');
  return result.recordset;
}



module.exports = {
  obtenerDistritos,
  buscarUsuarioPorGoogleId,
  crearUsuarioGoogle,
  insertarAuditoria,
  guardarTokenTemporal,
  guardarCodigoRecuperacion,
  verificarCodigoRecuperacion,
  crearUsuario,
  buscarUsuarioPorCorreo,
  obtenerUsuarioPorId,
  actualizarUsuario,
  listarPaises,
  listarProvincias,
  listarCantones,
  listarDestinosFavoritos,
  actualizarDatosPago,
  obtenerDatosPago,
  guardarTokenRecuperacion, 
  actualizarClave,        
  buscarPorToken,
  insertarLogSeguridad,     
  actualizarUltimoAcceso,     
  bloquearCuenta,
  guardarSecreto2FA,
  incrementarIntentosFallidos,
  reiniciarIntentosFallidos,
  obtenerEstadoBloqueo  
};
