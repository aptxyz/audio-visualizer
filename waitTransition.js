module.exports = (element) => {
    
    return new Promise(resolve => {
        element.addEventListener('transitionend', resolve, {once: true})
    })

}