import * as React from "react"
const SearchIcon = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={14}
    height={14}
    fill="none"
    aria-labelledby="search-icon"
    {...props}
  >
    <title>{"Search"}</title>
    <path d="m9 9 4 4m-7.333-2.667a4.667 4.667 0 1 1 0-9.333 4.667 4.667 0 0 1 0 9.333Z" 
    fill={props.fill}
    width={props.width}
    height={props.height}/>
  </svg>
)
export default SearchIcon;