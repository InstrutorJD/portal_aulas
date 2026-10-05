import type { Item } from '@/lib/tipos'

type Props = {
  item: Item
  onMarcar: (nome: string, conforme: boolean) => void
}

export default function ItemChecklist({ item, onMarcar }: Props) {
  return (
    <fieldset className="item">
      <legend>
        {item.nome}
        {item.critico && <span className="critico">crítico</span>}
      </legend>
      <label>
        <input
          type="radio"
          name={item.nome}
          checked={item.conforme === true}
          onChange={() => onMarcar(item.nome, true)}
        />
        Conforme
      </label>
      <label>
        <input
          type="radio"
          name={item.nome}
          checked={item.conforme === false}
          onChange={() => onMarcar(item.nome, false)}
        />
        Não conforme
      </label>
    </fieldset>
  )
}
