# Markdown Reference

Whenever you commit to the Doc-WebDoc branch, GitHub Pages will run 
[Jekyll](https://jekyllrb.com/) to rebuild the pages in your site, 
from the content in your Markdown files. This converts them into HTML for you.

## Basic Markdown Formatting

### Headings

    # This is an <h1> tag
    ## This is an <h2> tag
    ### This is an <h3> tag
    #### This is an <h4> tag
    ##### This is an <h5> tag
    ###### This is an <h6> tag
    
### Emphasis

    *This text will be italic*
    _This will also be italic_
    
    **This text will be bold**
    __This will also be bold__
    
    _You **can** combine them_
    
Result:

*This text will be italic*

_This will also be italic_

**This text will be bold**

__This will also be bold__

_You **can** combine them_

### Lists

**Inordered:**

    * Milk
    * Bread
        * Wholegrain
    * Butter

Result:

* Milk
* Bread
    * Wholegrain
* Butter

**Ordered:**

    1. Tidy the kitchen  
    2. Prepare ingredients  
    3. Cook delicious things

Result:

1. Tidy the kitchen  
2. Prepare ingredients  
3. Cook delicious things

### Images

    ![Alt Text](url)

Result:

![m'lady](http://i.imgur.com/v8IVDka.jpg)

However, for our case, we will use HTML to produce a cleaner image.
Just ensure the path to the file is correct (Please make sure they are less than 100KB)
and adjust the scale by changing the width percentage.
```html
<div style="text-align: center">
<img src="/SeniorDesignDoc/assets/img/profile/elmo.jpg" width="50%">
</div>
```
Result:
<div style="text-align: center">
<img src="/SeniorDesignDoc/assets/img/profile/elmo.jpg" width="50%">
</div>

### Links

    [link](http://example.com)
    
Result:

[link](http://example.com)

### Blockquotes

    As Kanye West said:

    > We're living the future so
    > the present is our past.

Result:

As Kanye West said:
> We're living the future so
> the present is our past.

### Horizontal Rules

    ---

Result:

---

### Code Snippets

    Indenting by 4 spaces will turn an entire paragraph into a code-block.

Result:

    .my-link {
        text-decoration: underline;
    }

### Reference Lists & Titles

    **The quick brown [fox][1], jumped over the lazy [dog][2].**

    [1]: https://en.wikipedia.org/wiki/Fox "Wikipedia: Fox"
    [2]: https://en.wikipedia.org/wiki/Dog "Wikipedia: Dog"

Result:

**The quick brown [fox][1], jumped over the lazy [dog][2].**

[1]: https://en.wikipedia.org/wiki/Fox "Wikipedia: Fox"
[2]: https://en.wikipedia.org/wiki/Dog "Wikipedia: Dog"

### Escaping

    \*literally\*

Result:

\*literally\*

### Embedding HTML

    <button class="button-save large">Big Button</button>

Result:

<button class="button-save large">Big Button</button>

## Advanced Markdown

Note: Some syntax which is not standard to native Markdown. They're extensions of the language.

### Strike-throughs

    ~~deleted words~~

Result:

~~deleted words~~

### Markdown Footnotes


    The quick brown fox[^1] jumped over the lazy dog[^2].

    [^1]: Foxes are red
    [^2]: Dogs are usually not red

Result:

The quick brown fox[^1] jumped over the lazy dog[^2].

[^1]: Foxes are red
[^2]: Dogs are usually not red

## GitHub Flavored Markdown

### Syntax Highlighting

    ```javascript
    function fancyAlert(arg) {
      if(arg) {
        $.facebox({div:'#foo'})
      }
    }
    ```

Result:

```javascript
function fancyAlert(arg) {
  if(arg) {
    $.facebox({div:'#foo'})
  }
}
```

### Task Lists

    - [x] @mentions, #refs, [links](), **formatting**, and <del>tags</del> supported
    - [x] list syntax required (any unordered or ordered list supported)
    - [x] this is a complete item
    - [ ] this is an incomplete item

Result:

- [x] @mentions, #refs, [links](), **formatting**, and <del>tags</del> supported
- [x] list syntax required (any unordered or ordered list supported)
- [x] this is a complete item
- [ ] this is an incomplete item

### Tables

You can create tables by assembling a list of words and dividing them with hyphens `-` (for the first row), and then separating each column with a pipe `|`:

First Header | Second Header
------------ | -------------
Content from cell 1 | Content from cell 2
Content in the first column | Content in the second column


For more details see [Basic writing and formatting syntax](https://docs.github.com/en/github/writing-on-github/getting-started-with-writing-and-formatting-on-github/basic-writing-and-formatting-syntax).