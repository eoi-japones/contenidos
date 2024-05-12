const yaml = require("js-yaml")
const fs = require("fs")
const path = require("path")
const ajv = require("ajv")

const docSchema = require("../schemas/doc.schema.json")
const nivelSchema = require("../schemas/nivel.schema.json")

const Ajv = new ajv()
const docValidation = Ajv.compile(docSchema)
const nivelValidation = Ajv.compile(nivelSchema)

//walk(process.env["DATA_DIR"])

walk(process.env["META_DIR"])

const clavesUnicas = {}

async function walk(dir = process.env["DATA_DIR"]){
  
  console.log(`DIR ${dir}`)

  await Promise.all(

    (await leerDir(dir)).map((entrada) => {

      return procesarEntrada(entrada)

    })

  ).catch((err) => {

    console.error(err)

    throw err

  })

}

  function determinarTipo(entrada){

      const dir = path.basename(path.dirname(entrada))

      return (dir == "docs") ? "DOC" :
                (dir == "niveles") ? "NIVEL" : 
           "DESCONOCIDO"

  }

  function procesarEntrada(entrada){

    if(entrada.tipo == "d")
      return walk(entrada.ruta)
    else
      return procesarFichero(entrada.ruta)
  }

  function procesarFichero(entrada){

    if(entrada.match(/\.yaml$|\.yml$/)){

      return new Promise((ok, ko) => {

        fs.readFile(entrada, 'utf-8', (err, data) => {
        
          if(err){

            return `Leyendo ${entrada}: ${err}`
          }


          try{
           
            data = yaml.load(data)

            tipo = determinarTipo(entrada)

            console.log(`Validando fichero de ${tipo} ${entrada}`)

            validarFichero(data, tipo)

          }
          catch(err){

            ko(`en "${entrada}": ${err}`)

          }

        })

      })

    }

  }

  function validarFichero(elData, tipo){

    const validador = (tipo === "DOC") ? docValidation : 
                        (tipo === "NIVEL" ) ? nivelValidation : null

    if(!validador(elData)){
       
      //console.log(JSON.stringify(validador.errors, null, 4))
      throw JSON.stringify(validador.errors, null, 4)
    }

    if(clavesUnicas[elData.id]){

      throw `Clave repetida: "${el.id}"`
    }
    else{

      clavesUnicas[elData.id] = true
    }

  }

  function leerDir(dir){

    return new Promise((ok, ko) => {

      fs.readdir(dir, function(err, entradas){

        if(err){

          return ko(`Leyendo ${dir}: ${err}`)
        }

        Promise.all(
          entradas.map((entrada) => {

            return new Promise((ok, ko) => {

              fs.stat(path.join(dir, entrada), (err, stats) => {

                if(err)
                  return ko(`Haciendo fstat sobre: ${path.join(dir, entrada)}: ${err}`)

                ok({

                  ruta: path.join(dir, entrada),

                  tipo: stats.isDirectory() ? "d" : "f"

                })

              })

            })

          })

        ).then((listado) => ok(listado))

        .catch((err) => {

          ko(err)
        })


      })

    })

  }
